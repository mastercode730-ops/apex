import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Admin sign-in: one username + password from env (ADMIN_USERNAME defaults to "admin", ADMIN_PASSWORD required).
 * A successful login sets a signed, httpOnly cookie (HMAC-SHA256, expires after 12 hours). Nothing is stored server-side.
 */
export const ADMIN_COOKIE = 'apex_admin';
export const SESSION_SECONDS = 12 * 60 * 60;

const user = () => process.env.ADMIN_USERNAME?.trim() || 'admin';
const pass = () => process.env.ADMIN_PASSWORD ?? '';
export const adminConfigured = () => pass().length >= 8;

const sha = (s: string) => createHash('sha256').update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(sha(a), sha(b)); // equal-length digests => constant time
const secret = () => process.env.ADMIN_SESSION_SECRET || `apex-admin:${user()}:${pass()}`;
const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function checkCredentials(username: unknown, password: unknown): boolean {
  if (!adminConfigured()) return false;
  const okUser = same(String(username ?? '').trim().toLowerCase(), user().toLowerCase());
  const okPass = same(String(password ?? ''), pass());
  return okUser && okPass; // both always evaluated
}

export function newSession(): { value: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return { value: `${exp}.${sign(String(exp))}`, maxAge: SESSION_SECONDS };
}

export function validSession(value: string | undefined): boolean {
  if (!value || !adminConfigured()) return false;
  const [exp, sig] = value.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  const want = sign(exp);
  return sig.length === want.length && timingSafeEqual(Buffer.from(sig), Buffer.from(want));
}

export function cookieFrom(req: Request, name = ADMIN_COOKIE): string | undefined {
  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
}
export const isAdminRequest = (req: Request) => validSession(cookieFrom(req));

/** CSRF guard for state-changing calls: the browser must say the request comes from this same site. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser clients (curl) carry no cookie anyway
  try { return new URL(origin).host === (req.headers.get('x-forwarded-host') ?? req.headers.get('host')); } catch { return false; }
}

export const cookieOptions = (maxAge: number) => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge });
