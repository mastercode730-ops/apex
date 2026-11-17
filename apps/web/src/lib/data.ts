/**
 * Async data facade used by every page. Chooses the provider from APEX_DATA_PROVIDER:
 *   demo       -> simulated data (default)
 *   sportmonks -> Sportmonks Cricket API (needs SPORTMONKS_TOKEN)
 */
import { demoProvider, series, playerById, type MatchView } from '@apex/core';
import { connection } from 'next/server';
import { sportmonksEnabled, smListMatches, smGetMatch } from './sportmonks';

export const isLiveFeed = () => sportmonksEnabled();

export async function getAllMatches(): Promise<MatchView[]> {
  if (!sportmonksEnabled()) return demoProvider.listMatches();
  await connection(); // live data is per-request: opt this route out of static prerendering
  try { return await smListMatches(); } catch (e) { console.error('[data] fixtures failed:', (e as Error).message); return []; }
}

export async function getMatchById(id: string): Promise<MatchView | undefined> {
  if (!sportmonksEnabled()) return demoProvider.getMatch(id.toUpperCase());
  await connection();
  try { return await smGetMatch(id); } catch (e) { console.error('[data] match failed:', (e as Error).message); return undefined; }
}

export async function getMatchesBySeries(seriesId: string) { return (await getAllMatches()).filter((m) => m.seriesId === seriesId); }
export async function getMatchesByTeam(teamId: string) { return (await getAllMatches()).filter((m) => m.team1Id === teamId || m.team2Id === teamId); }

/** Series are discovered from fixtures in live mode, so load matches first. */
export async function getSeriesList() { await getAllMatches(); return series; }

let warmed: Promise<void> | undefined;
/** In live mode players are discovered from match lineups; load a few recent matches once so player pages can resolve. */
export async function ensurePlayer(id: string) {
  if (!sportmonksEnabled() || playerById(id)) return;
  warmed ??= (async () => {
    const recent = (await getAllMatches()).filter((m) => m.status !== 'upcoming').slice(-6);
    await Promise.all(recent.map((m) => getMatchById(m.id)));
  })().finally(() => { setTimeout(() => { warmed = undefined; }, 30 * 60_000); });
  await warmed;
}
