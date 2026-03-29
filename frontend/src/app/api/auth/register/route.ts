import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, pwd } = body;

    if (!id || !pwd) {
      return NextResponse.json({ message: "아이디와 비밀번호를 입력해주세요." }, { status: 400 });
    }

    const existingUser = db.getUser(id);
    if (existingUser) {
      return NextResponse.json({ message: "이미 존재하는 아이디입니다." }, { status: 409 });
    }

    db.createUser(id, pwd);

    return NextResponse.json({ message: "회원가입 성공" }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}