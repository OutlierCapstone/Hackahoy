import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = db.getAllCargos();
  return NextResponse.json(data);
}