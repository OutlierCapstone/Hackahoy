import type { CookieOptions, Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'hackahoy_access_token';
export const GUEST_TOKEN_COOKIE = 'hackahoy_guest_token';

export function authCookieOptions(): CookieOptions {
  const configuredMaxAge = Number(process.env.AUTH_COOKIE_MAX_AGE_MS);
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge:
      Number.isFinite(configuredMaxAge) && configuredMaxAge > 0
        ? configuredMaxAge
        : 7 * 24 * 60 * 60 * 1000,
  };
}

export function readCookie(
  request: { headers?: { cookie?: string } } | undefined,
  name: string,
): string | null {
  const raw = request?.headers?.cookie;
  if (!raw) return null;

  for (const part of raw.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }

  return null;
}

export function setAuthCookie(response: Response, name: string, token: string) {
  response.cookie(name, token, authCookieOptions());
}

export function clearAuthCookie(response: Response, name: string) {
  const options = authCookieOptions();
  delete options.maxAge;
  response.clearCookie(name, options);
}
