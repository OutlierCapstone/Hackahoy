import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProblemCategory } from '@prisma/client';

@Injectable()
export class ProblemService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. 사용자의 문제 목록 조회 (섬 연동 + 카테고리 필터링)
  async getProblemsForUser(userId: string, islandId?: number) {
    const problems = await this.prisma.problem.findMany({
      where: islandId ? { islandId: islandId } : {},
      orderBy: { id: 'asc' },
      select: {
        id: true,
        islandId: true,
        title: true,
        category: true,
      },
    });

    const solvedHistories = await this.prisma.solvedHistory.findMany({
      where: { userId },
      select: { problemId: true },
    });

    const solvedProblemIds = solvedHistories.map((h) => h.problemId);

    return problems.map((p) => ({
      ...p,
      solved: solvedProblemIds.includes(p.id),
    }));
  }

  // 2. 플래그 제출 및 정답 확인 (submitFlag)
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

    const isCorrect = trimmed === problem.correctFlag;

    // 제출 기록 저장
    const submit = await this.prisma.submitFlag.create({
      data: { userId, problemId, submittedFlag: trimmed, isCorrect },
    });

    if (!submit.isCorrect) return { correct: false };

    // 이미 푼 문제인지 확인
    const already = await this.prisma.solvedHistory.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    if (already) return { correct: true, alreadySolved: true };

    // 풀이 이력 생성
    await this.prisma.solvedHistory.create({ data: { userId, problemId } });

    // 유저 레벨업 로직 (해결한 문제 수 기반)
    const totalSolvedCount = await this.prisma.solvedHistory.count({
      where: { userId },
    });

    let newLevel = 1;
    while (totalSolvedCount >= Math.pow(2, newLevel) - 1) newLevel++;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { levelNum: newLevel },
      select: { levelNum: true },
    });

    return { correct: true, alreadySolved: false, newLevel: updated.levelNum };
  }

  // 3. 개별 문제 상세 조회
  async getProblem(problemId: number) {
    return this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        islandId: true,
        title: true,
        description: true,
        category: true,
        hint: true,
        serverLink: true,
      },
    });
  }

  // 4. 문제 전체 리스트 조회 (관리자용 등)
  async listProblems() {
    return this.prisma.problem.findMany({
      orderBy: { id: 'asc' },
      include: { island: true },
    });
  }

  // 5. 신규 문제 생성 (메타데이터 및 섬 연결 처리)
  async createProblem(data: any) {
    let finalMetadata: any = undefined;

    // writeup 데이터가 있을 경우 JSON 파싱 시도
    if (data.writeup && data.writeup.trim() !== '') {
      try {
        finalMetadata =
          typeof data.writeup === 'string'
            ? JSON.parse(data.writeup)
            : data.writeup;
      } catch (e) {
        // JSON 형식이 아닐 경우 일반 텍스트로 저장
        finalMetadata = { rawText: data.writeup };
      }
    }

    return this.prisma.problem.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category as ProblemCategory,
        correctFlag: data.correctFlag,
        serverLink: data.serverLink,
        hint: data.hint || '힌트가 없습니다.',
        metadata: finalMetadata ?? undefined,
        island: {
          connect: { id: data.islandId ? Number(data.islandId) : 1 },
        },
      },
    });
  }
}
