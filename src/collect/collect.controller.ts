// src/collect/collect.controller.ts
//
// 변경 요약: nginx log_by_lua 가 새로 보내주는 status / resp_bytes / elapsed_ms / query 를
//            그대로 service 로 넘긴다. 나머지는 기존과 동일.

import {
  Body,
  Controller,
  ForbiddenException,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { CollectService } from './collect.service';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/collect')
export class CollectController {
  private readonly logger = new Logger('CollectController');

  constructor(private readonly collectService: CollectService) {}

  @Post()
  @SkipThrottle()
  async collectData(@Body() data: any, @Req() req: any) {
    return this.save(data, req.user.id);
  }

  @Public()
  @Post('internal')
  @SkipThrottle()
  async collectInternal(@Body() data: any, @Req() req: any) {
    if (!isInternalCollectorAddress(req.socket?.remoteAddress)) {
      throw new ForbiddenException('internal collector only');
    }
    return this.save(data, data.user_id);
  }

  private async save(data: any, userId: string) {
    const mappedData = {
      userId,
      problemId: Number(data.problem_id),
      method: data.method,
      uri: data.uri,
      query: data.query ?? '',
      payload: data.payload || '',
      status: data.status !== undefined ? Number(data.status) : null,
      respBytes: data.resp_bytes !== undefined ? Number(data.resp_bytes) : null,
      elapsedMs: data.elapsed_ms !== undefined ? Number(data.elapsed_ms) : null,
    };

    try {
      return await this.collectService.saveLog(mappedData);
    } catch (error) {
      this.logger.error('Log storage failed', error.stack);
      return { status: 'error', message: 'Internal Server Error' };
    }
  }
}

export function isInternalCollectorAddress(raw: string | undefined): boolean {
  const address = (raw ?? '').replace(/^::ffff:/, '');
  if (address === '::1' || address.startsWith('127.')) return true;
  if (address.startsWith('10.') || address.startsWith('192.168.')) return true;

  const match = address.match(/^172\.(\d+)\./);
  if (!match) return false;
  const second = Number(match[1]);
  return second >= 16 && second <= 31;
}
