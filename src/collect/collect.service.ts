import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CollectService {
  private readonly logger = new Logger('CollectService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async saveLog(data: any) {
  try {
    let targetUserId = data.userId || data.user_id;

    // Bearer 제거
    if (targetUserId && targetUserId.startsWith('Bearer ')) {
      targetUserId = targetUserId.replace('Bearer ', '');
    }

    // JWT decode
    if (targetUserId && targetUserId.includes('.')) {
      try {
        const decoded = this.jwtService.decode(targetUserId) as any;
        this.logger.log(`JWT decoded: ${JSON.stringify(decoded)}`);
        targetUserId = decoded?.userId || decoded?.sub || decoded?.id || targetUserId;
      } catch (e) {
        this.logger.warn(`JWT 파싱 실패: ${e.message}`);
      }
    }

    if (!targetUserId || targetUserId === 'anonymous') {
      this.logger.warn(`⚠️ 유효하지 않은 유저 ID: ${targetUserId}`);
      return { success: false, error: 'Invalid User ID' };
    }

    let parsedPayload = {};
    try {
      if (typeof data.payload === 'string' && data.payload.trim() !== '') {
        parsedPayload = JSON.parse(data.payload);
      } else {
        parsedPayload = data.payload || {};
      }
    } catch (e) {
      parsedPayload = { raw: data.payload };
    }

    const method = (data.method || 'UNKNOWN').toUpperCase();
    const path = data.uri || '/';
    const requestLine = `${method} ${path}`;

    const newLog = await this.prisma.userLog.create({
      data: {
        userId:    targetUserId,
        problemId: data.problemId ? Number(data.problemId) : 0,
        header:    { request: requestLine },
        body:      parsedPayload,
      },
    });

    return { success: true, logId: newLog.id.toString() };

  } catch (error: any) {
    this.logger.error(`❌ 저장 실패 userId=${data.userId}, uri=${data.uri}`);
    this.logger.error(`❌ 에러: ${error.message}`);
    return { success: false, error: error.message };
  }
}
}