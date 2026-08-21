import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getPlayerSession, jsonForPlayer } from '@/lib/player-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = getPlayerSession(request);
  return jsonForPlayer(session, db.getAllCargos(session.key));
}
