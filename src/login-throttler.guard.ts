import { Injectable, ExecutionContext, Inject, ForbiddenException } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage, ThrottlerRequest } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { BanService } from './ban/ban.service';

// 경로별 한도. 여기 없는 경로는 default(5분에 600회)만 받는다.
//
// 원래 'login' 스로틀러(5분에 20회)는 크리덴셜 브루트포스를 막으려던 것이다.
// 그런데 이 프로젝트에는 비밀번호 로그인이 없다. POST /auth/login 은
// { oauthProvider, oauthToken } 을 받아 제공자 토큰을 검증하는 것이고,
// GET /auth/kakao|google|naver 는 제공자로 보내는 리다이렉트다.
// 추측할 비밀번호가 없으니 고전적 브루트포스는 대상 자체가 없다.
//
// 실제로 조여야 하는 것은 인증 없이 부수효과를 만드는 엔드포인트다.
// POST /auth/guest 는 호출 한 번마다 User 행을 하나 만든다(실측: 40연타 -> 40행).
// default 만 적용되면 한 IP 가 5분에 600행, 하루 17만 행까지 만들 수 있어
// 베타 데이터가 오염되고 DB 가 커진다.
//
// 한도를 100 으로 두는 이유: 같은 와이파이를 쓰는 베타 참가자 50명이 동시에
// 시작해도(1인당 1~2회) 걸리지 않으면서, 대량 생성은 막는 선이다.
type RateRule = { prefix: string; limit: number; ban: boolean };

const RATE_LIMITED_PATHS: RateRule[] = [
  // OAuth 진입·검증. 호출마다 제공자 쪽 요청이 붙으므로 남용을 막는다.
  { prefix: '/auth/login', limit: 100, ban: true },
  { prefix: '/auth/kakao', limit: 100, ban: true },
  { prefix: '/auth/google', limit: 100, ban: true },
  { prefix: '/auth/naver', limit: 100, ban: true },
  // 인증 없이 User 행을 만든다. 로그인 시도가 아니므로 정지 대상은 아니다.
  { prefix: '/auth/guest', limit: 100, ban: false },
];

// /auth/me 는 일부러 넣지 않았다. 정상 탐색 중 반복 호출되는 경로다.
function matchRule(path: string): RateRule | undefined {
  const clean = (path || '').split('?')[0];
  return RATE_LIMITED_PATHS.find(
    (r) => clean === r.prefix || clean.startsWith(`${r.prefix}/`),
  );
}

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject('THROTTLER:MODULE_OPTIONS') options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly banService: BanService
  ) {
    super(options, storageService, reflector);
  }

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, throttler } = requestProps;
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // collect는 Nginx 내부 요청이라 rate limit 제외
    if (path.includes('/api/collect')) {
      return true;
    }

    // 'login' 스로틀러(5분에 20회)는 실제 로그인 경로에만 적용한다.
    //
    // 이 가드는 APP_GUARD 라 모든 요청을 탄다. ThrottlerModule 에 스로틀러가
    // 둘 등록돼 있으면 요청마다 둘 다 평가되므로, 예전에는 로그인과 무관한
    // 엔드포인트까지 5분에 20회로 묶였다. 실측으로 동시 50 요청 중 30개가
    // 403 이었고, 화면 몇 번 넘기는 정상 탐색만으로도 한도에 닿는다.
    // 일반 요청은 'default'(5분에 600회)만 적용받게 둔다.
    const rule = matchRule(path);

    // 'login' 스로틀러(5분에 20회)는 위 표에 있는 경로에만 적용한다.
    // 나머지는 default(5분에 600회)만 받는다.
    if (throttler.name === 'login' && !rule) {
      return true;
    }

    // 표에 있으면 그 한도를, 없으면 스로틀러 설정값을 그대로 쓴다.
    const currentLimit = rule ? rule.limit : requestProps.limit;

    return super.handleRequest({ ...requestProps, limit: currentLimit });
  }

// src/common/guards/login-throttler.guard.ts

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    
    // 1. 유저 식별자 가져오기 (로그인 중이면 body에서, 인증된 상태면 user에서)
    const userId = request.user?.id || request.body?.userId || request.body?.email;
    const path = request.url;

     if (path.includes('/api/collect')) return;

    // 정지(ban)는 표에서 ban: true 인 경로에만 적용한다.
    //
    // 스로틀러의 기본 추적 키는 IP 다. 베타처럼 여러 명이 같은 와이파이를 쓰면
    // 한도가 사람별이 아니라 출구 IP 단위로 소모되고, 그러면 한도를 넘긴 요청을
    // 한 사람이 자기 잘못 없이 24시간 정지된다.
    // 실제로 부하 테스트 한 번에 게스트 계정이 정지됐다(BanHistory ruleId=3).
    // 일반 요청과 게스트 발급은 잠시 물러나라는 신호로 충분하다.
    const rule = matchRule(path);
    if (!rule?.ban) {
      throw new ForbiddenException('요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.');
    }

    if (!userId) {
      throw new ForbiddenException('과도한 요청입니다.');
    }

    // 로그인 시도 초과만 정지 대상으로 둔다(크리덴셜 스터핑 방어).
    await this.banService.executeBan(userId, 1, '인증 시도 초과');

    throw new ForbiddenException('보안 정책 위반(인증 시도 초과)으로 인해 정지되었습니다.');
  }
}