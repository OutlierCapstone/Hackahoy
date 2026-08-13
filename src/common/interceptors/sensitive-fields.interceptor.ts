import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

const SENSITIVE_KEYS = new Set([
  'flag',
  'correctflag',
  'correct_flag',
  'submittedflag',
  'submitted_flag',
]);

const FLAG_PATTERN = /hackahoy\{[^}]*\}/gi;

export function redactSensitiveResponse(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(FLAG_PATTERN, 'hackahoy{[REDACTED]}');
  }

  if (Array.isArray(value)) {
    return value.map(redactSensitiveResponse);
  }

  if (
    value === null ||
    typeof value !== 'object' ||
    value instanceof Date ||
    Buffer.isBuffer(value)
  ) {
    return value;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_KEYS.has(key.toLowerCase()))
      .map(([key, nested]) => [key, redactSensitiveResponse(nested)]),
  );
}

@Injectable()
export class SensitiveFieldsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    context.switchToHttp().getResponse().setHeader('Cache-Control', 'no-store');
    return next.handle().pipe(map(redactSensitiveResponse));
  }
}
