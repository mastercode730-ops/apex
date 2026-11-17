/**
 * Sportmonks Cricket API v2.0 adapter. Server-side only (the token must never reach the browser).
 * Normalises Sportmonks fixtures into Apex `MatchView`s and registers teams/players/series
 * discovered in the feed, so the rest of the app stays vendor-neutral.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { teams, players, series, slugify, maxOvers, emptyCareerLine, type MatchView, type InningsView, type Format, type Role, type BatLine, type BowlLine, type CommentaryItem, type Series, type Team, type Player, type RankingEntry, type RankFormat, type CareerLine } from '@apex/core';

const BASE = 'https://cricket.sportmonks.com/api/v2.0/';
export const sportmonksEnabled = () => process.env.APEX_DATA_PROVIDER === 'sportmonks' && !!process.env.SPORTMONKS_TOKEN;

// Free plan allows 180 calls/hour: cache every call in-process and de-duplicate in-flight requests.
const gl = globalThis as unknown as { __apexSmCache?: Map<string, { t: number; v: Promise<any> }> };
const cache = (gl.__apexSmCache ??= new Map()); // shared across Next bundles
export const TTL = { list: 60, live: 30, upcoming: 300, done: 3600, lookup: 86400 };
const stats = { calls: 0, remaining: undefined as number | undefined, limit: undefined as number | undefined, lastError: '' };
export const getApiStats = () => ({ ...stats });

export class SportmonksError extends Error { constructor(public status: number, msg: string) { super(msg); } }

/** ttlSec = 0 bypasses the cache (used by the worker for live matches). */
async function sm(path: string, ttlSec: number): Promise<any> {
  const hit = cache.get(path);
  if (ttlSec > 0 && hit && Date.now() - hit.t < ttlSec * 1000) return hit.v;
  stats.calls++;
  const v = fetch(BASE + path, ({ headers: { Authorization: process.env.SPORTMONKS_TOKEN! }, cache: 'no-store' } as any)).then(async (r) => {
    const rem = r.headers.get('x-ratelimit-remaining'); if (rem != null) stats.remaining = Number(rem);
    const lim = r.headers.get('x-ratelimit-limit'); if (lim != null) stats.limit = Number(lim);
    if (!r.ok) { stats.lastError = `HTTP ${r.status}`; throw new SportmonksError(r.status, `Sportmonks HTTP ${r.status} for ${path.split('?')[0]}`); }
    return ((await r.json()) as any).data;
  });
  cache.set(path, { t: Date.now(), v });
  v.catch(() => cache.delete(path));
  return v;
}
const arr = (x: any): any[] => (Array.isArray(x) ? x : x?.data ?? []);

// ---------- registries (teams / players / series discovered from the feed) ----------
const teamMap = new Map<number, string>();
const playerMap = new Map<number, string>();
let wiped = false;

function hex(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  const s = 0.65, l = 0.5, a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
}
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

function regTeam(t: any): string {
  if (!t) return 'tbc';
  const known = teamMap.get(t.id); if (known) return known;
  const existing = teams.find((x) => norm(x.name) === norm(t.name));
  const id = existing?.id ?? (slugify(t.name) || `t${t.id}`);
  if (!teams.some((x) => x.id === id)) {
    teams.push({ id, code: (t.code ?? t.name.slice(0, 3)).toUpperCase(), name: t.name, color: hex(t.name), board: t.national_team ? 'National team' : 'Franchise / domestic team', since: 0, bio: `${t.name} cricket team.` });
  }
  teamMap.set(t.id, id);
  return id;
}

function regPlayer(p: any, teamId: string): string {
  const known = playerMap.get(p.id); if (known) return known;
  const id = slugify(p.fullname ?? `${p.firstname} ${p.lastname}`) || `p${p.id}`;
  const pos = String(p.position?.name ?? '').toLowerCase();
  const role: Role = pos.includes('wicket') ? 'Wicketkeeper' : pos.includes('all') ? 'All-rounder' : pos.includes('bowl') ? 'Bowler' : 'Batter';
  if (!players.some((x) => x.id === id)) {
    const pretty = (s?: string) => (s ? s.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '-');
    players.push({ id, name: p.fullname ?? id, teamId, role, battingStyle: pretty(p.battingstyle), bowlingStyle: pretty(p.bowlingstyle), born: p.dateofbirth ? String(p.dateofbirth).slice(0, 4) : '-' });
  }
  playerMap.set(p.id, id);
  return id;
}

function upsertSeries(league: any, seasonId: number, f: Format, teamIds: string[], dateIso: string, international: boolean) {
  if (!wiped) { series.length = 0; wiped = true; } // drop demo series once real data is in use
  const id = `${String(league?.code ?? 'lg').toLowerCase()}-${seasonId}`;
  let s = series.find((x) => x.id === id);
  if (!s) {
    s = { id, slug: id, name: league?.name ?? 'Cricket', short: league?.code ?? 'CRK', format: [], teamIds: [], start: dateIso, end: dateIso, kind: international ? 'International' : /big bash|premier|league/i.test(league?.name ?? '') ? 'League' : 'Domestic' } satisfies Series;
    series.push(s);
  }
  if (!s.format.includes(f)) s.format.push(f);
  teamIds.forEach((t) => { if (!s!.teamIds.includes(t)) s!.teamIds.push(t); });
  if (dateIso < s.start) s.start = dateIso;
  if (dateIso > s.end) s.end = dateIso;
  return s.id;
}

// ---------- mapping ----------
const toFormat = (t: string): Format => { const x = (t ?? '').toUpperCase(); return x.includes('T10') ? 'T10' : x.includes('ODI') ? 'ODI' : x.includes('TEST') || x.includes('4DAY') ? 'TEST' : 'T20'; };
const COMPLETED = new Set(['Finished', 'Aban.', 'Cancl.', 'Abandoned', 'Cancelled', 'Complete']);
function toStatus(s: string): MatchView['status'] { return s === 'NS' || s === 'Postp.' ? 'upcoming' : COMPLETED.has(s) ? 'completed' : 'live'; }
const ballsOf = (overs: number) => Math.floor(overs) * 6 + Math.round((overs % 1) * 10);

function toInnings(f: any, format: Format, status: MatchView['status']): InningsView[] {
  const runs = arr(f.runs).sort((a: any, b: any) => a.inning - b.inning);
  const out: InningsView[] = runs.map((r: any, i: number) => {
    const balls = ballsOf(Number(r.overs) || 0);
    return {
      battingTeamId: regTeam(r.team_id === f.localteam_id ? f.localteam : f.visitorteam), runs: r.score ?? 0, wickets: r.wickets ?? 0,
      overs: `${Math.floor(balls / 6)}.${balls % 6}`, ballsBowled: balls, runRate: balls ? +(((r.score ?? 0) / balls) * 6).toFixed(2) : 0,
      batting: [], bowling: [], fallOfWickets: [], extras: 0, complete: status === 'completed' || i < runs.length - 1,
      partnership: { runs: 0, balls: 0 },
    };
  });
  if (format !== 'TEST' && out.length === 2) out[1].target = out[0].runs + 1;
  return out;
}

function baseView(f: any): MatchView | undefined {
  const t1 = f.localteam, t2 = f.visitorteam;
  if (!t1 || !t2 || t1.name === 'TBC' || t2.name === 'TBC') return undefined;
  const format = toFormat(f.type), status = toStatus(f.status);
  const team1Id = regTeam(t1), team2Id = regTeam(t2);
  const seriesId = upsertSeries(f.league, f.season_id, format, [team1Id, team2Id], String(f.starting_at), !!(t1.national_team && t2.national_team));
  const innings = toInnings(f, format, status);
  const c1 = teams.find((t) => t.id === team1Id)!.code, c2 = teams.find((t) => t.id === team2Id)!.code;
  const label = f.round ?? f.type;
  let statusLine = f.note || f.status;
  const cur = innings[innings.length - 1];
  if (status === 'live' && cur?.target) statusLine = `${teams.find((t) => t.id === cur.battingTeamId)!.code} need ${Math.max(0, cur.target - cur.runs)} runs from ${Math.max(0, maxOvers(format) * 6 - cur.ballsBowled)} balls`;
  if (status === 'upcoming') statusLine = `Starts ${f.starting_at}`;
  return {
    id: String(f.id), slug: `${c1}-vs-${c2}-${slugify(String(label))}-${slugify(f.league?.code ?? 'lg')}-${f.id}`.toLowerCase(),
    seriesId, title: `${c1} vs ${c2}, ${String(label).replace(/,/g, '')}`, format, status, team1Id, team2Id,
    venue: f.venue?.name ?? 'TBC', city: f.venue?.city ?? '', startTime: new Date(f.starting_at).toISOString(),
    toss: f.toss_won_team_id ? `${teams.find((t) => t.id === teamMap.get(f.toss_won_team_id))?.name ?? 'Team'} won the toss and elected to ${f.elected === 'bowling' ? 'bowl' : 'bat'} first` : undefined,
    innings, result: status === 'completed' ? f.note : undefined, statusLine, commentary: [], recentOvers: [], umpires: [],
    winnerId: f.winner_team_id ? teamMap.get(f.winner_team_id) : undefined,
  };
}

const DAY = 86_400_000;
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export async function smListMatches(opts: { ttl?: number } = {}): Promise<MatchView[]> {
  const now = Date.now();
  const data = await sm(`fixtures?filter[starts_between]=${ymd(now - 10 * DAY)},${ymd(now + 21 * DAY)}&include=localteam,visitorteam,league,runs,venue&sort=starting_at`, opts.ttl ?? TTL.list);
  return arr(data).map(baseView).filter(Boolean) as MatchView[];
}

export async function smGetMatch(id: string, opts: { ttl?: number } = {}): Promise<MatchView | undefined> {
  if (!/^\d+$/.test(id)) return undefined;
  let ttl = opts.ttl;
  if (ttl === undefined) {
    const known = (await smListMatches().catch(() => [])).find((m) => m.id === id);
    ttl = known?.status === 'live' ? TTL.live : known?.status === 'upcoming' ? TTL.upcoming : TTL.done;
  }
  const f = await sm(`fixtures/${id}?include=localteam,visitorteam,league,runs,venue,batting,bowling,balls,lineup,scoreboards`, ttl).catch(() => undefined);
  if (!f?.id) return undefined;
  const v = baseView(f);
  if (!v) return undefined;

  for (const p of arr(f.lineup)) regPlayer(p, teamMap.get(p.lineup?.team_id) ?? v.team1Id);
  const pid = (smId: number) => playerMap.get(smId) ?? `sm-${smId}`;
  const nm = (smId: number) => players.find((p) => p.id === playerMap.get(smId))?.name ?? 'Player';
  const batting = arr(f.batting), bowling = arr(f.bowling), boards = arr(f.scoreboards), balls = arr(f.balls);

  v.innings.forEach((inn, i) => {
    const code = `S${i + 1}`;
    const bat = batting.filter((b: any) => b.scoreboard === code && (b.active || b.wicket_id || b.ball > 0)).sort((a: any, b: any) => a.sort - b.sort);
    inn.batting = bat.map((b: any): BatLine => ({
      playerId: pid(b.player_id), runs: b.score ?? 0, balls: b.ball ?? 0, fours: b.four_x ?? 0, sixes: b.six_x ?? 0,
      out: b.wicket_id ? (b.runout_by_id && !b.bowling_player_id ? 'run out' : `${b.catch_stump_player_id ? `c ${nm(b.catch_stump_player_id)} ` : ''}b ${nm(b.bowling_player_id)}`) : undefined,
    }));
    inn.fallOfWickets = bat.filter((b: any) => b.wicket_id && b.fow_score != null).sort((a: any, b: any) => a.fow_score - b.fow_score)
      .map((b: any, k: number) => ({ runs: b.fow_score, wicket: k + 1, playerId: pid(b.player_id), over: String(b.fow_balls ?? '') }));
    inn.bowling = bowling.filter((b: any) => b.scoreboard === code).sort((a: any, b: any) => a.sort - b.sort).map((b: any): BowlLine => ({
      playerId: pid(b.player_id), overs: String(b.overs), maidens: b.medians ?? 0, runs: b.runs ?? 0, wickets: b.wickets ?? 0, econ: b.rate ?? 0,
    }));
    const ex = boards.find((s: any) => s.scoreboard === code && s.type === 'extra');
    inn.extras = ex ? (ex.wide ?? 0) + (ex.noball_runs ?? 0) + (ex.bye ?? 0) + (ex.leg_bye ?? 0) + (ex.penalty ?? 0) : 0;
    // mark current batters on crease for live matches
    if (v.status === 'live' && i === v.innings.length - 1) {
      const active = bat.filter((b: any) => b.active);
      inn.batting.forEach((b, k) => { b.onStrike = bat[k]?.active && active[0] === bat[k]; });
    }
  });

  if (balls.length && v.status !== 'upcoming') {
    const scores: Map<number, any> = new Map(arr(await sm('scores', TTL.lookup).catch(() => [])).map((s: any) => [s.id, s]));
    const wanted = `S${v.innings.length}`;
    const lastCode = balls.some((b: any) => b.scoreboard === wanted) ? wanted : balls[balls.length - 1].scoreboard;
    const mine = balls.filter((b: any) => b.scoreboard === lastCode).sort((x: any, y: any) => x.ball - y.ball);
    const kind = (s: any): CommentaryItem['kind'] => (s?.is_wicket ? 'wicket' : s?.six ? 'six' : s?.four ? 'four' : 'ball');
    v.commentary = [...mine].reverse().slice(0, 60).map((b: any, k: number): CommentaryItem => {
      const s = scores.get(b.score_id);
      return { id: `${lastCode}-${b.id}-${k}`, over: String(b.ball), runs: s?.runs ?? 0, kind: kind(s),
        text: s?.is_wicket ? `WICKET! ${nm(b.bowler_id)} to ${nm(b.batsman_id)}, ${s.name}` : `${nm(b.bowler_id)} to ${nm(b.batsman_id)}, ${s?.name ?? 'no run'}` };
    });
    const byOver = new Map<number, { balls: string[]; runs: number }>();
    mine.forEach((b: any) => {
      const s = scores.get(b.score_id); const o = Math.floor(b.ball); const e = byOver.get(o) ?? { balls: [], runs: 0 };
      const r = (s?.runs ?? 0) + (s?.bye ?? 0) + (s?.leg_bye ?? 0) + (s?.noball_runs ?? 0);
      e.balls.push(s?.is_wicket ? 'W' : String(r)); e.runs += r; byOver.set(o, e);
    });
    v.recentOvers = [...byOver.entries()].slice(-3).map(([over, e]) => ({ over: over + 1, ...e }));
  }
  return v;
}

// ---------- rankings, careers, registry export ----------
export interface RankingSet { gender: 'men' | 'women'; format: RankFormat; kind: 'team'; entries: RankingEntry[]; }

export async function smRankings(): Promise<RankingSet[]> {
  const data = arr(await sm('team-rankings', TTL.lookup));
  return data.map((r: any): RankingSet => {
    const format: RankFormat = r.type === 'T20I' ? 'T20' : r.type === 'ODI' ? 'ODI' : 'TEST';
    const entries = arr(r.team).filter((t: any) => t.ranking?.position != null).map((t: any): RankingEntry => {
      const teamId = regTeam(t);
      return { rank: t.ranking.position, prev: t.ranking.position, teamId, name: t.name, rating: t.ranking.rating ?? t.ranking.points ?? 0 };
    }).sort((a: RankingEntry, b: RankingEntry) => a.rank - b.rank);
    return { gender: r.gender === 'women' ? 'women' : 'men', format, kind: 'team', entries };
  });
}

const careerFormat = (t: string) => (/test/i.test(t) ? 'Test' : t);
export async function smCareer(smPlayerId: number): Promise<CareerLine[]> {
  const d = await sm(`players/${smPlayerId}?include=career`, TTL.lookup);
  const rows = arr(d?.career);
  const by = new Map<string, CareerLine>();
  for (const row of rows) {
    const f = careerFormat(String(row.type)); const l = by.get(f) ?? emptyCareerLine(f); by.set(f, l);
    const b = row.batting, w = row.bowling;
    l.matches += Math.max(b?.matches ?? 0, w?.matches ?? 0);
    if (b) { l.innings += b.innings ?? 0; l.runs += b.runs_scored ?? 0; l.notOuts += b.not_outs ?? 0; l.balls += b.balls_faced ?? 0; l.highest = Math.max(l.highest, b.highest_inning_score ?? 0); l.fours += b.four_x ?? 0; l.sixes += b.six_x ?? 0; l.hundreds += b.hundreds ?? 0; l.fifties += b.fifties ?? 0; }
    if (w) { l.bowlInnings += w.innings ?? 0; l.overs += w.overs ?? 0; l.runsConceded += w.runs ?? 0; l.wickets += w.wickets ?? 0; l.fiveWickets += w.five_wickets ?? 0; }
  }
  return [...by.values()].map((l) => ({
    ...l, overs: +l.overs.toFixed(1),
    avg: l.innings - l.notOuts > 0 ? +(l.runs / (l.innings - l.notOuts)).toFixed(2) : 0, sr: l.balls ? +((l.runs / l.balls) * 100).toFixed(1) : 0,
    bowlAvg: l.wickets ? +(l.runsConceded / l.wickets).toFixed(2) : 0, econ: l.overs ? +(l.runsConceded / l.overs).toFixed(2) : 0,
  })).filter((l) => l.matches > 0).sort((a, b) => b.matches - a.matches);
}

/** Entities discovered while mapping, with their Sportmonks ids, for persistence by the worker. */
export function exportRegistry() {
  const teamRows: { smId: number; team: Team }[] = [];
  teamMap.forEach((id, smId) => { const team = teams.find((t) => t.id === id); if (team) teamRows.push({ smId, team }); });
  const playerRows: { smId: number; player: Player }[] = [];
  playerMap.forEach((id, smId) => { const player = players.find((p) => p.id === id); if (player) playerRows.push({ smId, player }); });
  return { teams: teamRows, players: playerRows, series: [...series] };
}
export const smPlayerIdOf = (slug: string) => { for (const [smId, id] of playerMap) if (id === slug) return smId; return undefined; };
