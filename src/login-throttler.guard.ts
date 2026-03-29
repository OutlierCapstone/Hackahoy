import { Injectable, ExecutionContext, Inject, ForbiddenException } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage, ThrottlerRequest } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { BanService } from './ban/ban.service';

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
    const { context, limit } = requestProps;
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // collect는 Nginx 내부 요청이라 rate limit 제외
    if (path.includes('/api/collect')) {
      return true;
    }

    let currentLimit = limit;
    
    // 🚨 테스트를 위해 /auth/가 들어간 모든 경로(auth/me 포함)를 5번으로 확 줄여봅시다.
    if (path.includes('/auth/')) {
      currentLimit =100; // 20번도 많아요, 일단 5번으로 테스트!
    }

    return super.handleRequest({ ...requestProps, limit: currentLimit });
  }

// src/common/guards/login-throttler.guard.ts

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    
    // 1. 유저 식별자 가져오기 (로그인 중이면 body에서, 인증된 상태면 user에서)
    const userId = request.user?.id || request.body?.userId || request.body?.email;
    const path = request.url;

     if (path.includes('/api/collect')) return;

    if (!userId) {
      throw new ForbiddenException('과도한 요청입니다.');
    }

    let ruleId = 3;
    let reason = '과도한 요청';

    if (path.includes('/auth/')) {
      ruleId = 1;
      reason = '인증 시도 초과';
    }

    // 2. IP 없이 userId만 넘겨서 차단 실행
    await this.banService.executeBan(userId, ruleId, reason);

    throw new ForbiddenException(`보안 정책 위반(${reason})으로 인해 정지되었습니다.`);
  }
}