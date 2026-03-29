import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, pwd } = body;

    if (!id || !pwd) {
      return NextResponse.json({ message: "아이디와 비밀번호를 입력해주세요." }, { status: 400 });
    }

    // 1. DB에서 유저 조회
    const user = db.getUser(id);

    // 2. 유저 조회 실패 or 비밀번호 틀림
    if (!user || user.pwd !== pwd) {
      return NextResponse.json({ message: "아이디 또는 비밀번호가 틀렸습니다." }, { status: 401 });
    }

    // 3. 로그인 성공
    return NextResponse.json({
      message: "로그인 성공",
      user: {
        id: user.id,
        role: user.role
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}