import { NextResponse } from 'next/server';
import { getMatchById } from '@/lib/data';

export const dynamic = 'force-dynamic';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const m = await getMatchById((await params).id);
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(m, { headers: { 'Cache-Control': 'no-store' } });
}
