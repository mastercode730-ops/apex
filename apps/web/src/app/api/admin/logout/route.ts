import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, cookieOptions } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export async function POST() {
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set(ADMIN_COOKIE, '', cookieOptions(0));
  return res;
}
