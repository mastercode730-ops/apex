import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminConfigured, checkCredentials, cookieOptions, newSession, sameOrigin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
const fails = new Map<string, { n: number; reset: number }>();
const ipOf = (req: Request) => req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
const json = (d: unknown, status = 200) => NextResponse.json(d, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad request' }, 403);
  if (!adminConfigured()) return json({ error: 'Admin login is not set up yet. Set ADMIN_PASSWORD (8+ characters) on the server.' }, 503);
  const ip = ipOf(req), now = Date.now();
  const f = fails.get(ip);
  if (f && now < f.reset && f.n >= 8) return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  if (!checkCredentials(body.username, body.password)) {
    const live = f && now < f.reset;
    fails.set(ip, { n: (live ? f.n : 0) + 1, reset: live ? f.reset : now + 10 * 60_000 });
    if (fails.size > 2000) fails.clear();
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    return json({ error: 'Incorrect username or password.' }, 401);
  }
  fails.delete(ip);
  const s = newSession();
  const res = json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, s.value, cookieOptions(s.maxAge));
  return res;
}
