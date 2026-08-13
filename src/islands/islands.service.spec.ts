import { IslandsService } from './islands.service';

describe('IslandsService', () => {
  it('returns only public island fields and never queries problem data', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 1, image: '/assets/backgrounds/island-1.png' },
    ]);
    const prisma = { island: { findMany } } as any;
    const service = new IslandsService(prisma);

    await expect(service.getAllIslands()).resolves.toEqual([
      { id: 1, image: '/assets/backgrounds/island-1.png' },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: {},
      select: { id: true, image: true },
    });
  });
});
