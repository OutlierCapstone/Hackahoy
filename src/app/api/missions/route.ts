import { NextResponse } from 'next/server';
import { MISSION_DB, USER_DB } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
     return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  let data;

  if (userId === 'captain') {
      data = MISSION_DB['captain'];
  } else if (USER_DB[userId]) {
      data = MISSION_DB['user'];
  } else {
      return NextResponse.json({ message: "존재하지 않는 사용자입니다." }, { status: 404 });
  }

  return NextResponse.json(data);
}