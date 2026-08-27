import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Prisma');

  // 로컬(특히 Windows) 에서 Prisma 엔진의 초기 $connect 가 간헐적으로 1초 이상 걸리거나
  // 실패해 부팅이 크래시했다. 몇 번 재시도하고, 그래도 안 되면 크래시 대신 경고만 남긴다.
  // Prisma 는 첫 쿼리에서 지연 연결되므로 앱은 계속 뜬다.
  async onModuleInit() {
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        this.logger.warn(
          `DB 연결 시도 ${attempt}/5 실패: ${(err as Error).message.split('\n')[0]}`,
        );
        if (attempt < 5) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
    }
    this.logger.error('DB 초기 연결에 모두 실패했습니다. 첫 요청 시 지연 연결을 시도합니다.');
  }
}