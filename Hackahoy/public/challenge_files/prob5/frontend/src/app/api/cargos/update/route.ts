// src/app/api/cargos/update/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cargo_id, destination } = body;

    const trimmedDestination = destination?.trim();

    if (!cargo_id || !trimmedDestination) {
      return NextResponse.json({ message: '위치를 정확히 입력해주세요.' }, { status: 400 });
    }

    // DB 업데이트 
    const success = db.updateCargoDestination(cargo_id, trimmedDestination);

    if (success) {
      return NextResponse.json({ message: '배송지가 변경되었습니다.' }, { status: 200 });
    } else {
      return NextResponse.json({ message: '화물을 찾을 수 없습니다.' }, { status: 404 });
    }

  } catch (error) {
    console.error("Update API Error:", error);
    return NextResponse.json({ message: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}