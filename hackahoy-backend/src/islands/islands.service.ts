import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IslandsService {
  constructor(private prisma: PrismaService) {}

  getAllIslands() {
    return this.prisma.island.findMany({
      include: {
        problems: true,
      },
    });
  }
  async getProblems(islandId: number, userId: string) {
    const problems = await this.prisma.problem.findMany({
      where: { islandId },
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

