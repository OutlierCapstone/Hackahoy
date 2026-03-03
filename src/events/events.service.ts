// src/events/events.service.ts
import { Injectable } from '@nestjs/common';
<<<<<<< HEAD
import { PrismaService } from '../prisma/prisma.service'; // PrismaService 경로 확인
=======
import { PrismaService } from '../prisma/prisma.service';
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
import { UserEventType } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async trackUserEvent(userId: string, problemId: number, type: UserEventType) {
    try {
<<<<<<< HEAD
=======
      // 1. 문제가 실제로 존재하는지 먼저 확인
      const problemExists = await this.prisma.problem.findUnique({
        where: { id: problemId },
        select: { id: true }, // 가볍게 ID만 조회
      });

      if (!problemExists) {
        console.warn(`[EventsService] 존재하지 않는 문제(ID: ${problemId})에 대한 이벤트 기록 건너뜀.`);
        return null;
      }

      // 2. 존재할 때만 생성
>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
      return await this.prisma.userEvent.create({
        data: { userId, problemId, type },
      });
    } catch (err) {
<<<<<<< HEAD
      console.warn(`[EventsService] userEvent 생성 실패 - userId: ${userId}, problemId: ${problemId}`, err.message);
      return null; // 서버 죽지 않게
    }
  }

  // 테스트를 위해 특정 유저의 이벤트를 조회하는 기능
=======
      console.error(
        `[EventsService] userEvent 생성 중 예상치 못한 에러 - userId: ${userId}`,
        err.message
      );
      return null;
    }
  }

>>>>>>> 18190ce (feat: implement user unban logic and automated daily security report)
  async getUserEvents(userId: string) {
    return this.prisma.userEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}