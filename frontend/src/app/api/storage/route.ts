import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const currentUserId = 'recruit'; 
  const user = db.getUser(currentUserId);
  const myCargos = db.getMyCargos(currentUserId, user?.role || '신입');

  return NextResponse.json({
    user: { role: user?.role },
    cargos: myCargos
  });
}