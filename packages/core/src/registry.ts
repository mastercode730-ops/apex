import type { Player, Series, Team } from './types';
import { teams } from './teams';
import { players } from './players';
import { series } from './series';

export interface RegistrySnapshot { teams: Team[]; players: Player[]; series: Series[]; }

/**
 * Merge a stored registry into the in-memory lists used by teamById/playerById/seriesById.
 * Stored entries win over built-ins with the same id. `replaceSeries` drops the demo series.
 */
export function loadRegistry(snap: RegistrySnapshot, opts: { replaceSeries?: boolean } = {}) {
  for (const t of snap.teams) { const i = teams.findIndex((x) => x.id === t.id); if (i >= 0) teams[i] = t; else teams.push(t); }
  for (const p of snap.players) { const i = players.findIndex((x) => x.id === p.id); if (i >= 0) players[i] = p; else players.push(p); }
  if (opts.replaceSeries) series.length = 0;
  for (const s of snap.series) { const i = series.findIndex((x) => x.id === s.id); if (i >= 0) series[i] = s; else series.push(s); }
}
