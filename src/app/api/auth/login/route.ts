import { NextResponse } from "next/server";
import { USER_DB } from "@/lib/data"; 

export async function POST(req: Request) {
  try {
    const { id, pwd } = await req.json();

    // 1. 아이디가 없거나 비밀번호가 틀리면 401 반환
    if (!USER_DB[id] || USER_DB[id] !== pwd) {
        return NextResponse.json({ message: "아이디 또는 비밀번호가 틀렸습니다." }, { status: 401 });
    }

    return NextResponse.json({ message: "로그인 성공" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}