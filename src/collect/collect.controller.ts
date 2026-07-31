// src/collect/collect.controller.ts
//
// 변경 요약: nginx log_by_lua 가 새로 보내주는 status / resp_bytes / elapsed_ms / query 를
//            그대로 service 로 넘긴다. 나머지는 기존과 동일.

import { Controller, Post, Body, Logger } from '@nestjs/common';
import { CollectService } from './collect.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('api/collect')
export class CollectController {
  private readonly logger = new Logger('CollectController');

  constructor(private readonly collectService: CollectService) {}

  @Post()
  @SkipThrottle()
  async collectData(@Body() data: any) {
    const mappedData = {
      userId: data.user_id,
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
