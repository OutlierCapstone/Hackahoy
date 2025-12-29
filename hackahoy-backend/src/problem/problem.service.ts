import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProblemService {
  constructor(private readonly prisma: PrismaService) {}

  async submitFlag(params: {
    problemId: number;
    userId: string;
    flag: string;
  }) {
    const { problemId, userId, flag } = params;

    const trimmed = (flag ?? '').trim();
    if (!trimmed) throw new BadRequestException('flag is required');

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, correctFlag: true },
    });
    if (!problem) throw new NotFoundException('problem not found');

    // 1) 제출 기록은 항상 남김
    await this.prisma.submitFlag.create({
      data: {
        userId,
        problemId,
        flag: trimmed,
      },
    });

    const correct = trimmed === problem.correctFlag;
    if (!correct) return { correct: false };

    // 2) 이미 풀었는지 체크 (중복 레벨업 방지)
    const already = await this.prisma.solvedHistory.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    if (already) return { correct: true, alreadySolved: true };

    // 3) solved 기록 추가
    await this.prisma.solvedHistory.create({
      data: { userId, problemId },
    });

    // 4)경험치 기반 레벨 시스템
    // 먼저 유저가 지금까지 총 몇 문제를 풀었는지 가져옵니다.
    const totalSolvedCount = await this.prisma.solvedHistory.count({
      where: { userId },
    });

    /**
     * 레벨 계산 로직 (누적 문제 수 기준):
     * 1렙 -> 0문제
     * 2렙 -> 1문제 (누적 1)
     * 3렙 -> 2문제 더 (누적 3)
     * 4렙 -> 4문제 더 (누적 7)
     * 5렙 -> 8문제 더 (누적 15)
     * 공식: 누적 문제 수가 (2^(level-1) - 1) 이상이면 해당 레벨
     */
    let newLevel = 1;
    while (totalSolvedCount >= Math.pow(2, newLevel) - 1) {
      newLevel++;
    }

    // 계산된 레벨로 유저 정보 업데이트
    const updated = await this.prisma.user.update({
      where: { id: userId }, // 만약 PK가 id가 아니라 email이면 { email: userId }로 수정
      data: { levelNum: newLevel },
      select: { levelNum: true },
    });

    return { correct: true, alreadySolved: false, newLevel: updated.levelNum };
  }

  async getProblem(problemId: number) {
    return this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        islandId: true,
        title: true,
        description: true,
        hint: true,
        serverLink: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createProblem(data: any) {
    return this.prisma.problem.create({
      data: {
        title: data.title,
        description: data.description,
        correctFlag: data.correctFlag,
        hint: data.hint,
        serverLink: data.serverLink,
        island: {
          connect: { id: Number(data.islandId) },
        },
      },
    });
  }

  // 관리자가 문제 목록 조회할 때 사용
  async listProblems() {
    return this.prisma.problem.findMany({
      orderBy: { id: 'asc' },
      include: { island: true },
    });
  }
}
