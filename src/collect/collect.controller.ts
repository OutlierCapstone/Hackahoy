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
    this.logger.log('--- Nginx Data Captured ---');

    const mappedData = {
      userId:    data.user_id,
      problemId: Number(data.problem_id),
      method:    data.method,
      uri:       data.uri,
      payload:   data.payload || '',
    };

    console.log('[DEBUG] method:', mappedData.method);
    console.log('[DEBUG] uri:', mappedData.uri);
    console.log('[DEBUG] payload length:', mappedData.payload.length);

    try {
      return await this.collectService.saveLog(mappedData);
    } catch (error) {
      this.logger.error('Log storage failed', error.stack);
      return { status: 'error', message: 'Internal Server Error' };
    }
  }
}