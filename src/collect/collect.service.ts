import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectService {
  private readonly logger = new Logger('CollectService');

  constructor(private prisma: PrismaService) {}

  async saveLog(data: any) {
    try {
      // 1. 유저 ID 추출 및 검증
      const targetUserId = data.userId || data.user_id;

      if (!targetUserId || targetUserId === 'anonymous') {
        this.logger.warn(`⚠️ 유효하지 않은 유저 ID (ID: ${targetUserId}). 저장을 건너뜁니다.`);
        return { success: false, error: 'Invalid User ID' };
      }

      // 2. Payload 파싱 (JSON 문자열 대응)
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

      // 3. 요청 정보 가공 (예: "POST /api/auth/login")
      const method = (data.method || 'UNKNOWN').toUpperCase();
      const path = data.uri || data.url || '/';
      const requestLine = `${method} ${path}`; 

      // 4. DB 저장 (객체 형태로 전달하여 Json 타입 오류 방지)
      const newLog = await this.prisma.userLog.create({
        data: {
          userId: targetUserId,
          problemId: data.problemId ? Number(data.problemId) : 0,
          header: { 
            request: requestLine  // 딱 이 필드 하나만 들어감
          },
          body: parsedPayload,
        },
      });

      return { success: true, logId: newLog.id.toString() };

    } catch (error: any) {
      this.logger.error(`❌ UserLog 저장 실패! ID=${data.userId}, URI=${data.uri}`);
      this.logger.error(`❌ 에러 메시지: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}