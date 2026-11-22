import { NextResponse } from 'next/server';
import * as db from '@apex/db';
import { isAdminRequest, sameOrigin } from '@/lib/adminAuth';
import { rateLimited } from '@/lib/api';

export const dynamic = 'force-dynamic';
const json = (d: unknown, status = 200) => NextResponse.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
function guard(req: Request, write = false): NextResponse | undefined {
  if (rateLimited(req, 120)) return json({ error: 'Too many requests' }, 429);
  if (!isAdminRequest(req)) return json({ error: 'Please sign in again.' }, 401);
  if (write && !sameOrigin(req)) return json({ error: 'Bad request' }, 403);
  if (!db.dbConfigured()) return json({ error: 'No database connected (DATABASE_URL).' }, 501);
}
export async function GET(req: Request) {
  const bad = guard(req); if (bad) return bad;
  return json({ data: await db.listContactRows(200) });
}
export async function DELETE(req: Request) {
  const bad = guard(req, true); if (bad) return bad;
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return json({ error: 'id required' }, 400);
  await db.deleteContactRow(id);
  return json({ ok: true });
}
