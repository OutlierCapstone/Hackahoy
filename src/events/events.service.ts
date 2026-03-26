// src/events/events.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserEventType } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async trackUserEvent(userId: string, problemId: number, type: UserEventType) {
    try {
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
      return await this.prisma.userEvent.create({
        data: { userId, problemId, type },
      });
    } catch (err) {
      console.error(
        `[EventsService] userEvent 생성 중 예상치 못한 에러 - userId: ${userId}`,
        err.message
      );
      return null;
    }
  }

  async getUserEvents(userId: string) {
    return this.prisma.userEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}