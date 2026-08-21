import { NextRequest } from "next/server";
import { getUserDb } from "@/lib/data";
import { getPlayerSession, jsonForPlayer } from "@/lib/player-session";

export async function POST(req: NextRequest) {
  const session = getPlayerSession(req);

  try {
    const { id, pwd } = await req.json();
    const userDb = getUserDb(session.key);

    // 1. 아이디가 없거나 비밀번호가 틀리면 401 반환 (같은 플레이어의 저장소 기준)
    if (!userDb[id] || userDb[id] !== pwd) {
      return jsonForPlayer(session, { message: "아이디 또는 비밀번호가 틀렸습니다." }, { status: 401 });
    }

    return jsonForPlayer(session, { message: "로그인 성공" }, { status: 200 });

  } catch (error) {
    return jsonForPlayer(session, { message: "서버 오류" }, { status: 500 });
  }
}
