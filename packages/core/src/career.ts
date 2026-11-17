import { hash, rng } from './rng';

export interface CareerLine {
  format: string; matches: number; innings: number; runs: number; notOuts: number; balls: number; highest: number;
  fours: number; sixes: number; hundreds: number; fifties: number; avg: number; sr: number;
  bowlInnings: number; overs: number; runsConceded: number; wickets: number; bowlAvg: number; econ: number; fiveWickets: number;
}

export const emptyCareerLine = (format: string): CareerLine => ({
  format, matches: 0, innings: 0, runs: 0, notOuts: 0, balls: 0, highest: 0, fours: 0, sixes: 0, hundreds: 0, fifties: 0, avg: 0, sr: 0,
  bowlInnings: 0, overs: 0, runsConceded: 0, wickets: 0, bowlAvg: 0, econ: 0, fiveWickets: 0,
});

/** Demo career numbers (seeded) used only when no real data source is configured. */
export function demoCareer(playerId: string): CareerLine[] {
  return ['Test', 'ODI', 'T20I'].map((format) => {
    const r = rng(hash(`${playerId}-${format}`));
    const matches = Math.floor((format === 'Test' ? 40 : format === 'ODI' ? 90 : 70) * (0.5 + r()));
    const runs = Math.floor(matches * (format === 'Test' ? 45 : format === 'ODI' ? 38 : 24) * (0.5 + r()));
    const balls = Math.floor(runs / ((format === 'Test' ? 0.5 : format === 'ODI' ? 0.88 : 1.38) * (0.85 + r() * 0.3)));
    const wickets = Math.floor(matches * (0.2 + r() * 1.4));
    const overs = Math.floor(matches * 3.5);
    return { ...emptyCareerLine(format), matches, innings: matches, runs, balls, notOuts: Math.floor(matches * 0.12), highest: Math.floor(runs / matches * 2.4), fours: Math.floor(runs / 9), sixes: Math.floor(runs / 40),
      hundreds: Math.floor(runs / (format === 'Test' ? 900 : 1500)), fifties: Math.floor(runs / 450), avg: +(runs / Math.max(1, matches * 0.88)).toFixed(2), sr: balls ? +((runs / balls) * 100).toFixed(1) : 0,
      bowlInnings: matches, overs, runsConceded: Math.floor(overs * 5.4), wickets, bowlAvg: wickets ? +((overs * 5.4) / wickets).toFixed(2) : 0, econ: 5.4, fiveWickets: Math.floor(wickets / 25) };
  });
}
