import { createHash, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'prob2-player';
const FALLBACK_SESSION_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export interface PlayerSession {
  key: string;
  newCookie?: string;
}

function hashIdentity(identity: string): string {
  return createHash('sha256').update(identity).digest('hex');
}

export function getPlayerSession(request: NextRequest): PlayerSession {
  const platformUid = request.cookies.get('uid')?.value.trim();
  if (platformUid) {
    return { key: hashIdentity(`platform:${platformUid}`) };
  }

  const existingSession = request.cookies.get(SESSION_COOKIE)?.value;
  if (existingSession && FALLBACK_SESSION_PATTERN.test(existingSession)) {
    return { key: hashIdentity(`fallback:${existingSession}`) };
  }

  const newCookie = randomUUID();
  return {
    key: hashIdentity(`fallback:${newCookie}`),
    newCookie,
  };
}

export function jsonForPlayer<T>(
  session: PlayerSession,
  body: T,
  init?: ResponseInit,
): NextResponse<T> {
  const response = NextResponse.json(body, init);

  if (session.newCookie) {
    response.cookies.set(SESSION_COOKIE, session.newCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
  }

  return response;
}
