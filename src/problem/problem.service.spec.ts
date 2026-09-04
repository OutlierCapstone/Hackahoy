import { ProblemService } from './problem.service';

describe('ProblemService.submitFlag', () => {
  it('returns an explicit incorrect result for a wrong flag', async () => {
    const prisma = {
      problem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          correctFlag: 'test-correct-flag',
        }),
      },
      solvedHistory: { findUnique: jest.fn().mockResolvedValue(null) },
      submitFlag: {
        create: jest.fn().mockResolvedValue({ isCorrect: false }),
      },
    } as any;
    const service = new ProblemService(prisma);

    await expect(
      service.submitFlag({
        problemId: 1,
        userId: 'user-1',
        flag: 'test-wrong-flag',
      }),
    ).resolves.toEqual({ correct: false });
  });

  it('caps the calculated level at the highest configured level', async () => {
    const prisma = {
      problem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          correctFlag: 'test-correct-flag',
        }),
      },
      solvedHistory: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(7),
      },
      submitFlag: {
        create: jest.fn().mockResolvedValue({ isCorrect: true }),
      },
      level: {
        findFirst: jest.fn().mockResolvedValue({ levelNum: 3 }),
      },
      user: {
        update: jest.fn().mockResolvedValue({ levelNum: 3 }),
      },
    } as any;
    const service = new ProblemService(prisma);

    await expect(
      service.submitFlag({
        problemId: 7,
        userId: 'user-1',
        flag: 'test-correct-flag',
      }),
    ).resolves.toEqual({
      correct: true,
      alreadySolved: false,
      newLevel: 3,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { levelNum: 3 },
      select: { levelNum: true },
    });
  });
});
