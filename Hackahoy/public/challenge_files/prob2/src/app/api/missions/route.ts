import { NextRequest } from 'next/server';
import { MISSION_DB, getUserDb } from '@/lib/data';
import { getPlayerSession, jsonForPlayer } from '@/lib/player-session';

export async function GET(request: NextRequest) {
  const session = getPlayerSession(request);
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return jsonForPlayer(session, { message: "로그인이 필요합니다." }, { status: 401 });
  }

  let data;

  // 의도된 IDOR: userId=captain 이면 로그인 여부와 무관하게 captain 임무(flag 포함)를
  // 그대로 돌려준다. 이 동작은 문제의 정답 경로이므로 절대 바꾸지 않는다.
  if (userId === 'captain') {
    data = MISSION_DB['captain'];
  } else if (getUserDb(session.key)[userId]) {
    data = MISSION_DB['user'];
  } else {
    return jsonForPlayer(session, { message: "존재하지 않는 사용자입니다." }, { status: 404 });
  }

  return jsonForPlayer(session, data);
}
