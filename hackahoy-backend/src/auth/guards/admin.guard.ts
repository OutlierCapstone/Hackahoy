import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // JWTStrategy가 넣어준 user 정보에 isAdmin이 true인지 확인
    if (user && user.isAdmin) {
      return true;
    }

    throw new ForbiddenException('관리자 권한이 필요합니다.');
  }
}
