import { Injectable, ExecutionContext, Inject, ForbiddenException } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage, ThrottlerRequest } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { BanService } from './ban/ban.service';

// 실제 "로그인 시도" 로 볼 경로.
//
// /auth/me 나 /auth/guest 는 여기 넣지 않는다. 둘 다 정상 탐색 중에 반복 호출되는
// 경로라, 로그인 시도용 엄격한 한도를 걸면 평범한 사용자가 막힌다.
const LOGIN_PATHS = [
  '/auth/login',
  '/auth/kakao',
  '/auth/google',
  '/auth/naver',
];

function isLoginPath(path: string): boolean {
  const clean = (path || '').split('?')[0];
  return LOGIN_PATHS.some((p) => clean === p || clean.startsWith(`${p}/`));
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
    if (throttler.name === 'login' && !isLoginPath(path)) {
      return true;
    }

    // 로그인 경로의 한도는 현재 배포본과 동일하게 유지한다(20 -> 100).
    // 스로틀러 설정값(20)을 그대로 쓰면 지금 돌아가는 것보다 오히려 빡빡해진다.
    // 추적 키가 IP 라, 같은 와이파이를 쓰는 베타에서 참가자들이 소셜 로그인을
    // 누르면 20 은 쉽게 넘는다. 이 PR 은 일반 요청 문제만 고치고
    // 로그인 쪽 동작은 건드리지 않는다.
    const currentLimit = isLoginPath(path) ? 100 : requestProps.limit;

    return super.handleRequest({ ...requestProps, limit: currentLimit });
  }

// src/common/guards/login-throttler.guard.ts

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    
    // 1. 유저 식별자 가져오기 (로그인 중이면 body에서, 인증된 상태면 user에서)
    const userId = request.user?.id || request.body?.userId || request.body?.email;
    const path = request.url;

     if (path.includes('/api/collect')) return;

    // 로그인 경로가 아니면 정지시키지 않는다.
    //
    // 스로틀러의 기본 추적 키는 IP 다. 베타처럼 여러 명이 같은 와이파이를 쓰면
    // 한도가 사람별이 아니라 출구 IP 단위로 소모되고, 그러면 21번째 요청을 한
    // 사람이 자기 잘못 없이 24시간 정지된다.
    // 실제로 부하 테스트 한 번에 게스트 계정이 정지됐다(BanHistory ruleId=3).
    // 일반 요청 초과는 잠시 물러나라는 신호로 충분하다.
    if (!isLoginPath(path)) {
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