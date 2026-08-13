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
});
