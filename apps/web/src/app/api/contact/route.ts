import { NextResponse } from 'next/server';
import * as db from '@apex/db';

const hits = new Map<string, number[]>();
const clean = (s: unknown, max: number) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const ipOf = (req: Request) => req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';

async function turnstileOk(token: unknown, ip: string) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true; // CAPTCHA is optional until configured
  if (typeof token !== 'string' || !token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }) });
    return ((await r.json()) as { success?: boolean }).success === true;
  } catch { return false; }
}

export async function POST(req: Request) {
  const ip = ipOf(req), now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 5) return NextResponse.json({ error: 'Too many messages. Try again later.' }, { status: 429 });
  hits.set(ip, [...recent, now]);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true }); // honeypot: pretend success

  const name = clean(body.name, 80), email = clean(body.email, 120), message = clean(body.message, 2000);
  if (name.length < 2) return NextResponse.json({ error: 'Please enter your name.' }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 });
  if (message.length < 10) return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 422 });
  if (!(await turnstileOk(body['cf-turnstile-response'], ip))) return NextResponse.json({ error: 'Please complete the verification challenge.' }, { status: 400 });

  let delivered = false;
  if (db.dbConfigured()) { try { await db.saveContact(name, email, message); delivered = true; } catch (e) { console.error('[contact] db save failed:', (e as Error).message); } }
  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO_EMAIL;
  if (key && to) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: process.env.CONTACT_FROM_EMAIL ?? 'Apex <onboarding@resend.dev>', to: [to], reply_to: email, subject: `Apex contact: ${name}`, text: `${name} <${email}>\n\n${message}` }),
      });
      if (r.ok) delivered = true; else console.error('[contact] resend failed', r.status);
    } catch (e) { console.error('[contact] resend error', (e as Error).message); }
  }
  if (!delivered) {
    if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Could not send your message right now. Please try again later.' }, { status: 503 });
    console.warn('[contact] no database or email configured; message validated but not stored (dev only).');
  }
  return NextResponse.json({ ok: true });
}
