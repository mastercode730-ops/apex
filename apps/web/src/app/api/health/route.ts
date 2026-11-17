import { NextResponse } from 'next/server';
import { getHealth } from '@/lib/data';

export const dynamic = 'force-dynamic';

/** Liveness/readiness for Docker healthchecks and uptime monitors. 503 if the DB is down or the worker is stale. */
export async function GET(req: Request) {
  // ?probe=live is the Docker liveness check: process is up (no dependency checks, so a slow DB never restarts the web container).
  if (new URL(req.url).searchParams.get('probe') === 'live') return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  const h = await getHealth();
  return NextResponse.json(h, { status: h.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
