// src/collect/collect.controller.ts
import { Controller, Post, Body, Logger } from '@nestjs/common';
import { CollectService } from './collect.service';

@Controller('api/collect') // 수동 테스트 주소와 일치시킴
export class CollectController {
  private readonly logger = new Logger('CollectController');

  constructor(private readonly collectService: CollectService) {}

  @Post()
  async collectData(@Body() data: any) {
    this.logger.log('--- Nginx Data Captured ---');
    console.log('User ID:', data.user_id);
    console.log('Problem ID:', data.problem_id);
    console.log('Method:', data.method);
    console.log('Payload:', data.payload);

    return await this.collectService.saveLog(data);
  }
}
