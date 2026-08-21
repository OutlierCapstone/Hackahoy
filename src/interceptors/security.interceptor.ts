import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

type SecurityRequest = {
  method: string;
  body?: unknown;
};

@Injectable()
export class SecurityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<SecurityRequest>();
    if (req.method === 'GET') return next.handle();

    const body = JSON.stringify(req.body || {}).toLowerCase();

    if (
      ['<script', 'select ', 'drop ', 'union '].some((word) =>
        body.includes(word),
      )
    ) {
      throw new BadRequestException('보안 위협 감지');
    }

    return next.handle();
  }
}
