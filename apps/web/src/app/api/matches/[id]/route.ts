import { NextResponse } from 'next/server';
import { getMatch } from '@apex/core';

export const dynamic = 'force-dynamic';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const m = getMatch((await params).id.toUpperCase());
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(m, { headers: { 'Cache-Control': 'no-store' } });
}
