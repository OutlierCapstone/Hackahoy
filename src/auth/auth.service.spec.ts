import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('AuthService authentication', () => {
  it('always signs JWTs with an expiration', () => {
    const previous = process.env.JWT_EXPIRES_IN;
    process.env.JWT_EXPIRES_IN = '1h';
    try {
      const jwt = new JwtService({ secret: 'unit-test-secret' });
      const service = new AuthService(jwt, {} as any);
      const payload = jwt.verify<{ iat: number; exp: number }>(
        service.signToken({ userId: 'user-1', provider: 'guest' }),
      );

      expect(payload.exp).toBeGreaterThan(payload.iat);
      expect(payload.exp - payload.iat).toBe(60 * 60);
    } finally {
      if (previous === undefined) delete process.env.JWT_EXPIRES_IN;
      else process.env.JWT_EXPIRES_IN = previous;
    }
  });

  it('rejects non-expiring legacy tokens outside the migration window', async () => {
    const previous = process.env.LEGACY_MIGRATION_UNTIL;
    delete process.env.LEGACY_MIGRATION_UNTIL;
    const prisma = { user: { findUnique: jest.fn() } } as any;
    const service = new AuthService(
      {
        verifyAsync: jest.fn().mockResolvedValue({
          userId: 'legacy-user',
          provider: 'guest',
        }),
      } as any,
      prisma,
    );

    try {
      await expect(service.restoreSessionUser('legacy-token')).resolves.toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.LEGACY_MIGRATION_UNTIL;
      else process.env.LEGACY_MIGRATION_UNTIL = previous;
    }
  });

  it('allows a legacy token during the explicit migration window', async () => {
    const previous = process.env.LEGACY_MIGRATION_UNTIL;
    process.env.LEGACY_MIGRATION_UNTIL = '2999-01-01T00:00:00Z';
    const user = { id: 'legacy-user', isBanned: false };
    const service = new AuthService(
      {
        verifyAsync: jest.fn().mockResolvedValue({
          userId: user.id,
          provider: 'guest',
        }),
      } as any,
      { user: { findUnique: jest.fn().mockResolvedValue(user) } } as any,
    );

    try {
      await expect(service.restoreSessionUser('legacy-token')).resolves.toEqual({
        user,
        provider: 'guest',
      });
    } finally {
      if (previous === undefined) delete process.env.LEGACY_MIGRATION_UNTIL;
      else process.env.LEGACY_MIGRATION_UNTIL = previous;
    }
  });

  it('rejects an empty nickname before writing to the database', async () => {
    const prisma = { user: { update: jest.fn() } } as any;
    const service = new AuthService({} as any, prisma);

    await expect(service.updateNickname('user-1', '   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('trims a valid nickname before saving it', async () => {
    const prisma = {
      user: { update: jest.fn().mockResolvedValue({ nickname: 'captain' }) },
    } as any;
    const service = new AuthService({} as any, prisma);

    await service.updateNickname('user-1', '  captain  ');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { nickname: 'captain' } }),
    );
  });
});

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
