import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getPlayerSession, jsonForPlayer } from '@/lib/player-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getPlayerSession(request);
  const currentUserId = 'recruit';
  const user = db.getUser(session.key, currentUserId);
  const myCargos = db.getMyCargos(session.key);

  return jsonForPlayer(session, {
    user: { role: user?.role },
    cargos: myCargos
  });
}
