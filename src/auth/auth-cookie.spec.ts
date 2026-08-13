import {
  ACCESS_TOKEN_COOKIE,
  authCookieOptions,
  readCookie,
} from './auth-cookie';

describe('auth cookies', () => {
  it('reads a named cookie without exposing unrelated values', () => {
    const request = {
      headers: {
        cookie: `theme=dark; ${ACCESS_TOKEN_COOKIE}=header.payload.signature; locale=ko`,
      },
    };

    expect(readCookie(request, ACCESS_TOKEN_COOKIE)).toBe(
      'header.payload.signature',
    );
    expect(readCookie(request, 'missing')).toBeNull();
  });

  it('uses HttpOnly and SameSite protection', () => {
    expect(authCookieOptions()).toEqual(
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });

  it('defaults to Secure cookies in production', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousCookieSecure = process.env.COOKIE_SECURE;
    process.env.NODE_ENV = 'production';
    delete process.env.COOKIE_SECURE;
    try {
      expect(authCookieOptions().secure).toBe(true);
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
      if (previousCookieSecure === undefined) delete process.env.COOKIE_SECURE;
      else process.env.COOKIE_SECURE = previousCookieSecure;
    }
  });

  it('does not throw on malformed percent encoding', () => {
    expect(
      readCookie(
        { headers: { cookie: `${ACCESS_TOKEN_COOKIE}=%E0%A4%A` } },
        ACCESS_TOKEN_COOKIE,
      ),
    ).toBeNull();
  });
});
