import { NextRequest, NextResponse } from "next/server";
import { getUserDb } from "@/lib/data";
import { getPlayerSession, jsonForPlayer } from "@/lib/player-session";

export async function POST(req: NextRequest) {
  const session = getPlayerSession(req);

  try {
    const body = await req.json();
    const { id, pwd } = body;

    if (!id || !pwd) {
      return jsonForPlayer(session, { message: "ID와 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const userDb = getUserDb(session.key);

    // 1. 중복 체크 (같은 플레이어의 저장소 안에서만)
    if (userDb[id]) {
      return jsonForPlayer(session, { message: "이미 존재하는 ID입니다." }, { status: 409 });
    }

    // 2. 가입 처리 (플레이어별 메모리에 저장)
    userDb[id] = pwd;

    return jsonForPlayer(session, { message: "회원가입 성공!" }, { status: 201 });

  } catch (error) {
    return jsonForPlayer(session, { message: "서버 오류" }, { status: 500 });
  }
}
