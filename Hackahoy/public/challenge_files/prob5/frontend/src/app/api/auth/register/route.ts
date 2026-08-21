import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getPlayerSession, jsonForPlayer } from "@/lib/player-session";

export async function POST(req: NextRequest) {
  const session = getPlayerSession(req);

  try {
    const body = await req.json();
    const { id, pwd } = body;

    if (!id || !pwd) {
      return jsonForPlayer(session, { message: "아이디와 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const existingUser = db.getUser(session.key, id);
    if (existingUser) {
      return jsonForPlayer(session, { message: "이미 존재하는 아이디입니다." }, { status: 409 });
    }

    db.createUser(session.key, id, pwd);

    return jsonForPlayer(session, { message: "회원가입 성공" }, { status: 201 });

  } catch (error) {
    return jsonForPlayer(session, { message: "서버 오류" }, { status: 500 });
  }
}
