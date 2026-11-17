/**
 * Async data facade used by every page and API route. Provider is chosen by APEX_DATA_PROVIDER:
 *   demo       simulated data (default; no setup)
 *   sportmonks dev convenience: matches straight from Sportmonks (rate-limited); other data is demo
 *   database   PRODUCTION: everything is read from Postgres, which the worker keeps in sync with the feed
 */
import { connection } from 'next/server';
import {
  articles as demoArticles, computeLeaders, demoCareer, demoProvider, loadRegistry, playerById, rankings as demoRankings, series, stats as demoStats,
  type Article, type CareerLine, type MatchView, type RankFormat, type RankKind, type RankingEntry, type StatRow,
} from '@apex/core';
import { sportmonksEnabled, smListMatches, smGetMatch } from '@apex/sportmonks';
import * as db from '@apex/db';
import { memo } from './memo';

export type Mode = 'demo' | 'sportmonks' | 'database';
export function mode(): Mode {
  const m = process.env.APEX_DATA_PROVIDER;
  if (m === 'database' && db.dbConfigured()) return 'database';
  if (m === 'sportmonks' && sportmonksEnabled()) return 'sportmonks';
  return 'demo';
}
export const isDb = () => mode() === 'database';
/** True when rankings/stats/careers/news shown to users are simulated. */
export const extrasAreDemo = () => !isDb();
/** The feed provides team rankings only; individual player rankings need another source. */
export const hasPlayerRankings = () => !isDb();

const DAY = 86_400_000;

// ---------- registry (teams / players / series discovered by the worker) ----------
async function hydrate() {
  if (!isDb()) return;
  await memo('registry', 30_000, async () => { loadRegistry(await db.loadRegistryRows(), { replaceSeries: true }); return true; });
}

// ---------- matches ----------
export async function getAllMatches(): Promise<MatchView[]> {
  const m = mode();
  if (m === 'demo') return demoProvider.listMatches();
  await connection(); // per-request data: opt out of static prerendering
  try {
    if (m === 'sportmonks') return await smListMatches();
    await hydrate();
    return await memo('matches', 3_000, () => db.listMatchRows(new Date(Date.now() - 10 * DAY), new Date(Date.now() + 21 * DAY)));
  } catch (e) { console.error('[data] matches failed:', (e as Error).message); return []; }
}

export async function getMatchById(id: string): Promise<MatchView | undefined> {
  const m = mode();
  if (m === 'demo') return demoProvider.getMatch(id.toUpperCase());
  await connection();
  try {
    if (m === 'sportmonks') return await smGetMatch(id);
    if (!/^\d+$/.test(id)) return undefined;
    await hydrate();
    return await memo(`match:${id}`, 2_000, () => db.getMatchRow(id));
  } catch (e) { console.error('[data] match failed:', (e as Error).message); return undefined; }
}

export async function getMatchesBySeries(seriesId: string) {
  if (isDb()) { await connection(); await hydrate(); return memo(`ms:${seriesId}`, 5_000, () => db.listMatchRowsBySeries(seriesId)); }
  return (await getAllMatches()).filter((m) => m.seriesId === seriesId);
}
export async function getMatchesByTeam(teamId: string) {
  if (isDb()) { await connection(); await hydrate(); return memo(`mt:${teamId}`, 5_000, () => db.listMatchRowsByTeam(teamId)); }
  return (await getAllMatches()).filter((m) => m.team1Id === teamId || m.team2Id === teamId);
}

/** Series/teams are discovered from the feed, so make sure they are loaded first. */
export async function getSeriesList() { await getAllMatches(); await hydrate(); return series; }
export async function ensureRegistry() { await getAllMatches(); await hydrate(); }

let warmed: Promise<void> | undefined;
/** sportmonks (dev) mode only: players are discovered from lineups, so load a few matches once. */
export async function ensurePlayer(id: string) {
  await hydrate();
  if (mode() !== 'sportmonks' || playerById(id)) return;
  warmed ??= (async () => {
    const recent = (await getAllMatches()).filter((m) => m.status !== 'upcoming').slice(-6);
    await Promise.all(recent.map((m) => getMatchById(m.id)));
  })().finally(() => { setTimeout(() => { warmed = undefined; }, 30 * 60_000); });
  await warmed;
}

// ---------- rankings, stats, careers ----------
export async function getRankings(kind: RankKind, format: RankFormat, gender: 'men' | 'women'): Promise<RankingEntry[]> {
  if (!isDb()) return demoRankings(kind, format, gender);
  await connection();
  if (kind !== 'team') return [];
  return memo(`rank:${gender}:${kind}:${format}`, 60_000, async () => (await db.getRanking(gender, kind, format)) ?? []);
}
/** Compact ranking block for the home page. */
export async function getHomeRankings() {
  if (hasPlayerRankings()) return { title: 'Top T20I batters', href: '/rankings/men/batter', rows: await getRankings('batter', 'T20', 'men') };
  return { title: 'Top T20I teams', href: '/rankings/men/team', rows: await getRankings('team', 'T20', 'men') };
}

export async function getStatLeaders(category: string, seriesId: string): Promise<StatRow[]> {
  if (!isDb()) return demoStats(category, seriesId);
  await connection(); await hydrate();
  const matches = await memo(`done:${seriesId}`, 120_000, () => db.completedDetails(seriesId || undefined));
  return computeLeaders(matches, category);
}

export async function getCareer(playerId: string): Promise<CareerLine[]> {
  if (!isDb()) return demoCareer(playerId);
  await connection();
  return memo(`career:${playerId}`, 300_000, async () => (await db.getCareerRow(playerId)) ?? []);
}

// ---------- articles ----------
export async function getArticles(opts: { category?: string; seriesId?: string; teamId?: string; limit?: number } = {}): Promise<Article[]> {
  let list: Article[];
  if (isDb()) { await connection(); list = await memo(`articles:${opts.category ?? ''}`, 15_000, () => db.listArticleRows({ category: opts.category, limit: 200 })); }
  else list = opts.category ? demoArticles.filter((a) => a.category === opts.category) : demoArticles;
  if (opts.seriesId) list = list.filter((a) => a.seriesId === opts.seriesId);
  if (opts.teamId) list = list.filter((a) => a.teamIds?.includes(opts.teamId!));
  return opts.limit ? list.slice(0, opts.limit) : list;
}
export async function getArticle(slug: string): Promise<Article | undefined> {
  if (isDb()) { await connection(); return memo(`article:${slug}`, 15_000, () => db.getArticleRow(slug)); }
  return demoArticles.find((a) => a.slug === slug);
}

// ---------- health ----------
export async function getHealth() {
  const m = mode();
  const out: Record<string, unknown> = { ok: true, mode: m, time: new Date().toISOString() };
  if (m === 'database') {
    try {
      await db.ping();
      const w = await db.getState<{ at: string }>('worker');
      const age = w ? Math.round((Date.now() - new Date(w.value.at).getTime()) / 1000) : null;
      out.db = 'up'; out.workerHeartbeatAgeSeconds = age;
      out.workerStale = age === null || age > 300; // worker writes a heartbeat every minute
      if (out.workerStale) out.ok = false;
    } catch (e) { out.ok = false; out.db = 'down'; out.error = (e as Error).message; }
  }
  return out;
}
