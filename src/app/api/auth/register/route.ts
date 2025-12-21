import { NextResponse } from "next/server";
import { USER_DB } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, pwd } = body;

    if (!id || !pwd) {
      return NextResponse.json({ message: "ID와 비밀번호를 입력해주세요." }, { status: 400 });
    }

    // 1. 중복 체크
    if (USER_DB[id]) {
      return NextResponse.json({ message: "이미 존재하는 ID입니다." }, { status: 409 });
    }

    // 2. 가입 처리 (메모리에 저장)
    USER_DB[id] = pwd;

    return NextResponse.json({ message: "회원가입 성공!" }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}