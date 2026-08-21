// src/app/api/cargos/update/route.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getPlayerSession, jsonForPlayer } from '@/lib/player-session';

const MAX_DESTINATION_LENGTH = 64;

export async function POST(request: NextRequest) {
  const session = getPlayerSession(request);

  try {
    const body = await request.json();
    const { cargo_id, destination } = body;

    if (typeof cargo_id !== 'string' || typeof destination !== 'string') {
      return jsonForPlayer(session, { message: '화물과 위치를 문자열로 입력해주세요.' }, { status: 400 });
    }

    const trimmedCargoId = cargo_id.trim();
    const trimmedDestination = destination.trim();
    if (!trimmedCargoId || !trimmedDestination || trimmedDestination.length > MAX_DESTINATION_LENGTH) {
      return jsonForPlayer(session, { message: '위치는 1자 이상 64자 이하로 입력해주세요.' }, { status: 400 });
    }

    const success = db.updateCargoDestination(session.key, trimmedCargoId, trimmedDestination);

    if (success) {
      return jsonForPlayer(session, { message: '배송지가 변경되었습니다.' }, { status: 200 });
    } else {
      return jsonForPlayer(session, { message: '화물을 찾을 수 없습니다.' }, { status: 404 });
    }

  } catch (error) {
    console.error("Update API Error:", error);
    return jsonForPlayer(session, { message: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}
