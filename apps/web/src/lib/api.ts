import { NextResponse } from 'next/server';
import { playerById, teamById, type MatchView } from '@apex/core';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'content-type' };
// On globalThis so every route bundle shares one counter (Next bundles routes separately).
const g = globalThis as unknown as { __apexHits?: Map<string, { n: number; reset: number }> };
const hits = (g.__apexHits ??= new Map());

function clientIp(req: Request) {
  // Behind Caddy/Cloudflare the real client IP is in these headers.
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
}

/** Per-IP fixed window rate limit (in-process; enough for a single instance). */
export function rateLimited(req: Request, limit = Number(process.env.API_RATE_LIMIT_PER_MIN ?? 120)): boolean {
  const ip = clientIp(req), now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.reset) { hits.set(ip, { n: 1, reset: now + 60_000 }); if (hits.size > 5000) hits.clear(); return false; }
  return ++h.n > limit;
}

/** Lookup tables for every team/player id referenced by the matches, so clients need no second request. */
export function refsFor(matches: MatchView[]) {
  const t: Record<string, { name: string; code: string; color: string }> = {};
  const p: Record<string, { name: string; role: string }> = {};
  const addTeam = (id: string) => { const x = teamById(id); if (x && !t[id]) t[id] = { name: x.name, code: x.code, color: x.color }; };
  const addPlayer = (id: string) => { const x = playerById(id); if (x && !p[id]) p[id] = { name: x.name, role: x.role }; };
  for (const m of matches) {
    addTeam(m.team1Id); addTeam(m.team2Id);
    for (const i of m.innings) {
      addTeam(i.battingTeamId);
      i.batting.forEach((b) => addPlayer(b.playerId)); i.bowling.forEach((b) => addPlayer(b.playerId)); i.fallOfWickets.forEach((f) => addPlayer(f.playerId));
    }
  }
  return { teams: t, players: p };
}

export function ok(req: Request, data: unknown, opts: { cache?: string; refs?: unknown } = {}) {
  if (rateLimited(req)) return err('Too many requests', 429, { 'Retry-After': '30' });
  return NextResponse.json({ data, ...(opts.refs ? { refs: opts.refs } : {}) }, { headers: { ...CORS, 'Cache-Control': opts.cache ?? 'public, s-maxage=3, stale-while-revalidate=20' } });
}
export function err(message: string, status = 400, extra: Record<string, string> = {}) {
  return NextResponse.json({ error: message }, { status, headers: { ...CORS, ...extra } });
}
export const options = () => new NextResponse(null, { status: 204, headers: CORS });
