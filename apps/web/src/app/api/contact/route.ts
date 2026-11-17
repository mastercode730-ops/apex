import { NextResponse } from 'next/server';

const hits = new Map<string, number[]>();
const clean = (s: unknown, max: number) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const now = Date.now();
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

  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO_EMAIL;
  if (key && to) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: 'Apex <onboarding@resend.dev>', to: [to], reply_to: email, subject: `Apex contact: ${name}`, text: `${name} <${email}>\n\n${message}` }),
    });
    if (!r.ok) return NextResponse.json({ error: 'Could not send your message. Please try again later.' }, { status: 502 });
  } else {
    console.warn('[contact] RESEND_API_KEY/CONTACT_TO_EMAIL not set; message was validated but not delivered.');
  }
  return NextResponse.json({ ok: true });
}
