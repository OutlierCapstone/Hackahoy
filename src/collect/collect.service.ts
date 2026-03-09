// src/collect/collect.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectService {
  private readonly logger = new Logger('CollectService');

  constructor(private prisma: PrismaService) {}

  async saveLog(data: any) {
    try {
      // payload가 문자열로 올 경우 JSON 파싱
      let parsedPayload = {};
      try {
        parsedPayload =
          typeof data.payload === 'string'
            ? JSON.parse(data.payload)
            : data.payload || {};
      } catch {
        parsedPayload = { raw: data.payload };
      }

      const newLog = await this.prisma.userLog.create({
        data: {
          userId: data.user_id || 'anonymous',
          problemId: data.problem_id ? Number(data.problem_id) : 0,
          header: data.headers || {},
          body: parsedPayload,
        },
      });

      return { success: true, logId: newLog.id.toString() };
    } catch (error: any) {
      this.logger.error(`❌ UserLog 저장 실패: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
