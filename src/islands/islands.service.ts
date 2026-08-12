import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 베타에서 잠시 잠글 대상.
 *
 *   HIDDEN_ISLAND_IDS=3
 *   HIDDEN_PROBLEM_IDS=7
 *
 * 데이터를 지우지 않고 노출만 막는다. 값을 비우고 재시작하면 그대로 돌아온다.
 *
 * 섬 3에는 문제 7(과자 마을) 하나뿐인데 그 문제가 구동되지 않는다.
 * 문제만 숨기면 빈 섬이 남으므로 섬째로 잠근다.
 * 지도의 핀 3은 /islands 응답에 그 섬이 있어야 열리므로(CreateSlotsLayer),
 * 목록에서 빼는 것으로 핀도 같이 잠긴다.
 */
function parseIdList(raw: string | undefined): number[] {
  return (raw ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

function hiddenIslandIds(): number[] {
  return parseIdList(process.env.HIDDEN_ISLAND_IDS);
}

function hiddenProblemIds(): number[] {
  return parseIdList(process.env.HIDDEN_PROBLEM_IDS);
}

@Injectable()
export class IslandsService {
  constructor(private prisma: PrismaService) {}

  getAllIslands() {
    const hidden = hiddenIslandIds();
    return this.prisma.island.findMany({
      where: hidden.length ? { id: { notIn: hidden } } : {},
      include: {
        problems: true,
      },
    });
  }

  async getProblems(islandId: number, userId: string) {
    if (hiddenIslandIds().includes(islandId)) {
      throw new NotFoundException('island not found');
    }

    const hiddenProblems = hiddenProblemIds();
    const problems = await this.prisma.problem.findMany({
      where: {
        islandId,
        ...(hiddenProblems.length ? { id: { notIn: hiddenProblems } } : {}),
      },
      orderBy: { id: 'asc' },
      include: {
        solved: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    return problems.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      hint: p.hint,
      solved: p.solved.length > 0,
    }));
  }
}
