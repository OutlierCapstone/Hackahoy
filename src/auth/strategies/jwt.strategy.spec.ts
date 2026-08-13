import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const previousSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'unit-test-secret';
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  it('rejects legacy tokens without an expiration on protected APIs', async () => {
    const strategy = new JwtStrategy({
      user: { findUnique: jest.fn() },
    } as any);

    await expect(
      strategy.validate({ userId: 'user-1', provider: 'guest' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a non-expired token for an existing user', async () => {
    const user = { id: 'user-1' };
    const strategy = new JwtStrategy({
      user: { findUnique: jest.fn().mockResolvedValue(user) },
    } as any);

    await expect(
      strategy.validate({
        userId: 'user-1',
        provider: 'guest',
        exp: Math.floor(Date.now() / 1000) + 60,
      }),
    ).resolves.toBe(user);
  });
});
