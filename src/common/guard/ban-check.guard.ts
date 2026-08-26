// src/common/guards/ban-check.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class BanCheckGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 로그인 안 된 요청(소셜 로그인 진행 중 등)은 여기서 막지 않고 통과.
    const user = request.user;
    if (!user || !user.id) {
      return true;
    }

    // JWT 전략(validate)이 매 요청마다 이미 최신 User 를 DB 에서 읽어 request.user 에
    // 넣어 준다(isBanned 포함). 여기서 또 findUnique 하면 인증 요청마다 중복 DB 조회가
    // 되어 로컬(특히 Windows Prisma)에서 응답이 눈에 띄게 느려졌다. 이미 로드된 값을 쓴다.
    if (user.isBanned) {
      throw new ForbiddenException('넌 나가라.');
    }

    return true;
  }
}