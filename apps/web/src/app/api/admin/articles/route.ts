import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { slugify } from '@apex/core';
import * as db from '@apex/db';
import { rateLimited } from '@/lib/api';
import { memoInvalidate } from '@/lib/memo';

export const dynamic = 'force-dynamic';
const CATS = ['news', 'records', 'analysis', 'prediction', 'reactions', 'listicles', 'stories'] as const;
const json = (d: unknown, status = 200) => NextResponse.json(d, { status, headers: { 'Cache-Control': 'no-store' } });

/** Bearer-token auth (ADMIN_TOKEN, min 16 chars). Constant-time compare; throttled against guessing. */
function check(req: Request): NextResponse | undefined {
  if (rateLimited(req, 30)) return json({ error: 'Too many requests' }, 429);
  const token = process.env.ADMIN_TOKEN;
  if (!token || token.length < 16) return json({ error: 'Admin is disabled: set ADMIN_TOKEN (16+ characters)' }, 503);
  if (!db.dbConfigured()) return json({ error: 'Admin needs DATABASE_URL' }, 501);
  const given = Buffer.from((req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(token);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return json({ error: 'Unauthorized' }, 401);
}

export async function GET(req: Request) {
  const bad = check(req); if (bad) return bad;
  return json({ data: await db.listArticleRows({ limit: 100 }) });
}

export async function POST(req: Request) {
  const bad = check(req); if (bad) return bad;
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const title = String(b.title ?? '').trim().slice(0, 200);
  const category = String(b.category ?? 'news');
  const paragraphs = (Array.isArray(b.body) ? b.body.map(String) : String(b.body ?? '').split(/\n{2,}/)).map((s) => s.trim()).filter(Boolean);
  if (title.length < 5) return json({ error: 'Title must be at least 5 characters' }, 422);
  if (!(CATS as readonly string[]).includes(category)) return json({ error: 'Invalid category' }, 422);
  if (!paragraphs.length) return json({ error: 'Body is required' }, 422);
  const slug = slugify(String(b.slug || title)).slice(0, 80);
  if (!slug) return json({ error: 'Could not build a slug from the title' }, 422);
  await db.upsertArticleRow({
    id: String(b.id || slug), slug, category: category as (typeof CATS)[number], title, excerpt: String(b.excerpt ?? paragraphs[0]).slice(0, 300),
    body: paragraphs, author: String(b.author ?? 'Apex Desk').slice(0, 80), seriesId: b.seriesId ? String(b.seriesId) : undefined,
    teamIds: Array.isArray(b.teamIds) ? b.teamIds.map(String) : [],
  });
  memoInvalidate('article');
  return json({ ok: true, slug });
}

export async function DELETE(req: Request) {
  const bad = check(req); if (bad) return bad;
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  await db.deleteArticleRow(id);
  memoInvalidate('article');
  return json({ ok: true });
}
