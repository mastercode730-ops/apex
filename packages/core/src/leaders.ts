import type { MatchView, StatRow } from './types';

export const statCategories = [
  { id: 'most-runs', label: 'Most Runs' }, { id: 'most-wickets', label: 'Most Wickets' }, { id: 'highest-strike-rate', label: 'Highest Strike Rate' },
  { id: 'most-hundreds', label: 'Most Hundreds' }, { id: 'most-sixes', label: 'Most Sixes' }, { id: 'most-fours', label: 'Most Fours' }, { id: 'most-fifties', label: 'Most Fifties' },
] as const;

interface Acc { playerId: string; teamId: string; matches: Set<string>; runs: number; balls: number; fours: number; sixes: number; fifties: number; hundreds: number; wickets: number; }

/** Leaderboards computed from stored scorecards of the given matches (pure function, no I/O). */
export function computeLeaders(matches: MatchView[], category: string, limit = 15): StatRow[] {
  const acc = new Map<string, Acc>();
  const get = (playerId: string, teamId: string) => {
    let a = acc.get(playerId);
    if (!a) { a = { playerId, teamId, matches: new Set(), runs: 0, balls: 0, fours: 0, sixes: 0, fifties: 0, hundreds: 0, wickets: 0 }; acc.set(playerId, a); }
    return a;
  };
  for (const m of matches) {
    for (const inn of m.innings) {
      const other = inn.battingTeamId === m.team1Id ? m.team2Id : m.team1Id;
      for (const b of inn.batting) {
        const a = get(b.playerId, inn.battingTeamId); a.matches.add(m.id);
        a.runs += b.runs; a.balls += b.balls; a.fours += b.fours; a.sixes += b.sixes;
        if (b.runs >= 100) a.hundreds++; else if (b.runs >= 50) a.fifties++;
      }
      for (const w of inn.bowling) { const a = get(w.playerId, other); a.matches.add(m.id); a.wickets += w.wickets; }
    }
  }
  const value: Record<string, (a: Acc) => number> = {
    'most-runs': (a) => a.runs, 'most-wickets': (a) => a.wickets, 'most-hundreds': (a) => a.hundreds, 'most-fifties': (a) => a.fifties,
    'most-sixes': (a) => a.sixes, 'most-fours': (a) => a.fours,
    'highest-strike-rate': (a) => (a.balls >= 30 ? +((a.runs / a.balls) * 100).toFixed(1) : 0),
  };
  const f = value[category]; if (!f) return [];
  return [...acc.values()].map((a) => ({ a, v: f(a) })).filter((x) => x.v > 0).sort((x, y) => y.v - x.v).slice(0, limit)
    .map((x, i) => ({ rank: i + 1, playerId: x.a.playerId, teamId: x.a.teamId, matches: x.a.matches.size, value: x.v }));
}
