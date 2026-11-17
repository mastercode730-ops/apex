/* Sync jobs: Sportmonks -> Postgres. Each job is idempotent and safe to retry. */
import { exportRegistry, getApiStats, smCareer, smGetMatch, smListMatches, smRankings, SportmonksError } from '@apex/sportmonks';
import { liveMatchIds, matchesNeedingDetail, playersNeedingCareer, saveCareer, saveRanking, setState, upsertMatchDetail, upsertMatchList, upsertPlayers, upsertSeries, upsertTeams, getState } from '@apex/db';

/** Skip optional work when the API budget is nearly spent (free plan: 180 calls/hour). */
export function budgetLow(min = Number(process.env.RATE_BUDGET_MIN_REMAINING ?? 15)) {
  const { remaining } = getApiStats();
  return remaining !== undefined && remaining < min;
}

export async function persistRegistry() {
  const reg = exportRegistry();
  await upsertSeries(reg.series);
  await upsertTeams(reg.teams);
  await upsertPlayers(reg.players);
  return { teams: reg.teams.length, players: reg.players.length, series: reg.series.length };
}

export async function syncFixtures() {
  const list = await smListMatches({ ttl: 0 });
  await upsertMatchList(list);
  const reg = await persistRegistry();
  return { matches: list.length, live: list.filter((m) => m.status === 'live').length, ...reg };
}

export async function syncLive() {
  const ids = await liveMatchIds();
  let ok = 0;
  for (const id of ids) {
    if (budgetLow(5)) break;
    const m = await smGetMatch(id, { ttl: 0 });
    if (m) { await upsertMatchDetail(m); ok++; }
  }
  if (ok) await persistRegistry();
  return { live: ids.length, updated: ok };
}

export async function backfillDetails(batch = Number(process.env.BACKFILL_BATCH ?? 8)) {
  if (budgetLow()) return { skipped: 'budget' };
  const ids = await matchesNeedingDetail(batch);
  let ok = 0;
  for (const id of ids) {
    if (budgetLow()) break;
    const m = await smGetMatch(id, { ttl: 0 });
    if (m) { await upsertMatchDetail(m); ok++; }
  }
  if (ok) await persistRegistry();
  return { pending: ids.length, updated: ok };
}

export async function syncRankings(force = false) {
  const last = await getState<{ at: string }>('rankings_synced');
  if (!force && last && Date.now() - new Date(last.value.at).getTime() < 24 * 3600_000) return { skipped: 'fresh' };
  const sets = await smRankings();
  for (const s of sets) await saveRanking(s.gender, s.kind, s.format, s.entries);
  await persistRegistry();
  await setState('rankings_synced', { at: new Date().toISOString(), sets: sets.length });
  return { sets: sets.length };
}

export async function syncCareers(batch = Number(process.env.CAREER_BATCH ?? 6)) {
  if (budgetLow(40)) return { skipped: 'budget' };
  const todo = await playersNeedingCareer(batch);
  let ok = 0;
  for (const p of todo) {
    if (budgetLow(40)) break;
    try { await saveCareer(p.id, await smCareer(p.smId)); ok++; }
    catch (e) {
      if (e instanceof SportmonksError && e.status === 404) await saveCareer(p.id, []); // nothing to fetch; do not retry every cycle
      else throw e;
    }
  }
  return { pending: todo.length, updated: ok };
}
