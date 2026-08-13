import { AuthService } from './auth.service';

describe('AuthService.deleteUserAccount', () => {
  it('deletes every dependent user record before deleting the user', async () => {
    const deleteMany = () => jest.fn().mockResolvedValue({ count: 0 });
    const tx = {
      submitFlag: { deleteMany: deleteMany() },
      solvedHistory: { deleteMany: deleteMany() },
      userEvent: { deleteMany: deleteMany() },
      hintHistory: { deleteMany: deleteMany() },
      userLog: { deleteMany: deleteMany() },
      banHistory: { deleteMany: deleteMany() },
      user: { delete: jest.fn().mockResolvedValue({ id: 'guest-1' }) },
    };
    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    } as any;
    const service = new AuthService({} as any, prisma);

    await expect(service.deleteUserAccount('guest-1')).resolves.toEqual({
      id: 'guest-1',
    });

    for (const model of [
      tx.submitFlag,
      tx.solvedHistory,
      tx.userEvent,
      tx.hintHistory,
      tx.userLog,
      tx.banHistory,
    ]) {
      expect(model.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'guest-1' },
      });
    }
    expect(tx.user.delete).toHaveBeenCalledWith({
      where: { id: 'guest-1' },
    });
  });
});
