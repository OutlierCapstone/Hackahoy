import { ProblemService } from './problem.service';

describe('ProblemService.submitFlag', () => {
  it('returns an explicit incorrect result for a wrong flag', async () => {
    const prisma = {
      problem: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          correctFlag: 'hackahoy{correct}',
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
        flag: 'hackahoy{wrong}',
      }),
    ).resolves.toEqual({ correct: false });
  });
});
