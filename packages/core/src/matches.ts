import type { CricketProvider, Format, MatchStatus, MatchView } from './types';
import { hash } from './rng';
import { teamById } from './teams';
import { squadOf, playerById } from './players';
import { simulateInnings, viewInnings, commentaryFor, maxOvers } from './engine';
import { series, seriesById } from './series';
import { slugify } from './players';

const MIN = 60_000;
const BALL_MS = 5_000; // demo speed: one delivery every 5 seconds
const ANCHOR = Date.now(); // fixed reference so live demo matches advance in real time

interface Def { id: string; seriesId: string; t1: string; t2: string; format: Format; label: string; venue: string; city: string; status: MatchStatus; startOffsetMin: number; }
const D = (id: string, seriesId: string, t1: string, t2: string, format: Format, label: string, venue: string, city: string, status: MatchStatus, startOffsetMin: number): Def => ({ id, seriesId, t1, t2, format, label, venue, city, status, startOffsetMin });

const defs: Def[] = [
  D('A1', 'ind-vs-nz-2026', 'ind', 'nz', 'T20', '1st T20', 'Eden Park', 'Auckland', 'live', -9),
  D('A2', 'eng-vs-aus-2026', 'eng', 'aus', 'ODI', '3rd ODI', 'Adelaide Oval', 'Adelaide', 'live', -30),
  D('A3', 'ban-vs-sa-2026', 'ban', 'sa', 'TEST', '1st Test', 'Wanderers Stadium', 'Johannesburg', 'live', -60),
  D('A4', 'apex-t10-2026', 'pak', 'aus', 'T10', '24th T10', 'Zayed Cricket Stadium', 'Abu Dhabi', 'live', -3),
  D('B1', 'ind-vs-nz-2026', 'ind', 'nz', 'ODI', '5th ODI', 'Hagley Oval', 'Christchurch', 'completed', -1500),
  D('B2', 'ind-vs-nz-2026', 'nz', 'ind', 'ODI', '4th ODI', 'Seddon Park', 'Hamilton', 'completed', -2900),
  D('B3', 'apex-t10-2026', 'eng', 'ind', 'T10', '23rd T10', 'Zayed Cricket Stadium', 'Abu Dhabi', 'completed', -400),
  D('B4', 'sl-vs-pak-2026', 'sl', 'pak', 'TEST', '1st Test', 'Galle International Stadium', 'Galle', 'completed', -4300),
  D('C1', 'ind-vs-nz-2026', 'ind', 'nz', 'T20', '2nd T20', 'Bay Oval', 'Mount Maunganui', 'upcoming', 1440),
  D('C2', 'eng-vs-aus-2026', 'aus', 'eng', 'ODI', '4th ODI', 'MCG', 'Melbourne', 'upcoming', 2900),
  D('C3', 'afg-vs-wi-2026', 'afg', 'wi', 'T20', '1st T20', 'Sharjah Cricket Stadium', 'Sharjah', 'upcoming', 600),
  D('C4', 'sl-vs-pak-2026', 'pak', 'sl', 'TEST', '2nd Test', 'Rawalpindi Cricket Stadium', 'Rawalpindi', 'upcoming', 4300),
  D('C5', 'apex-t10-2026', 'ind', 'pak', 'T10', 'Final', 'Zayed Cricket Stadium', 'Abu Dhabi', 'upcoming', 5800),
];

function build(def: Def, now: number): MatchView {
  const s = seriesById(def.seriesId)!;
  const t1 = teamById(def.t1)!, t2 = teamById(def.t2)!;
  const p1 = squadOf(def.t1), p2 = squadOf(def.t2);
  const start = ANCHOR + def.startOffsetMin * MIN;
  const seed = hash(def.id);
  const tossWinner = seed % 2 ? t1 : t2;
  const batFirst = seed % 3 === 0 ? t2 : t1;
  const bat1 = batFirst.id === t1.id ? p1 : p2, bat2 = batFirst.id === t1.id ? p2 : p1;
  const i1 = simulateInnings(seed + 1, bat1, bat2, def.format);
  const first = viewInnings(i1, i1.length, bat1, bat2, batFirst.id, def.format, i1.length);
  const target = def.format === 'TEST' ? undefined : first.runs + 1;
  const i2 = simulateInnings(seed + 2, bat2, bat1, def.format, target);
  const totalBalls = i1.length + i2.length;
  const bat2Team = batFirst.id === t1.id ? t2 : t1;

  let reveal = 0;
  if (def.status === 'completed') reveal = totalBalls;
  else if (def.status === 'live') reveal = Math.max(1, Math.floor((now - start) / BALL_MS)) % (totalBalls - 4) + 2;
  // reveal counts all deliveries incl. wides
  const r1 = Math.min(reveal, i1.length), r2 = Math.max(0, reveal - i1.length);

  const innings = [];
  if (reveal > 0) innings.push(viewInnings(i1, r1, bat1, bat2, batFirst.id, def.format, i1.length));
  if (r2 > 0) innings.push(viewInnings(i2, r2, bat2, bat1, bat2Team.id, def.format, i2.length, target));

  let result: string | undefined;
  let winnerId: string | undefined;
  let statusLine = '';
  if (def.status === 'upcoming') statusLine = `Starts ${new Date(start).toISOString()}`;
  else if (def.status === 'live') {
    const cur = innings[innings.length - 1];
    if (innings.length === 2 && target) statusLine = `${teamById(cur.battingTeamId)!.code} need ${Math.max(0, target - cur.runs)} runs from ${maxOvers(def.format) * 6 - cur.ballsBowled} balls`;
    else if (def.format === 'TEST') statusLine = `Day ${1 + Math.floor((now - start) / (60 * MIN)) % 3}, session ${1 + Math.floor((now - start) / (20 * MIN)) % 3}`;
    else statusLine = `${teamById(cur.battingTeamId)!.code} batting, ${cur.overs} overs`;
  } else {
    const a = innings[0], b = innings[1];
    if (def.format === 'TEST') { result = a.runs > b.runs ? `${teamById(a.battingTeamId)!.name} lead by ${a.runs - b.runs} runs` : `${teamById(b.battingTeamId)!.name} lead by ${b.runs - a.runs} runs`; }
    else if (b.runs >= (target ?? 0)) { winnerId = b.battingTeamId; result = `${teamById(b.battingTeamId)!.name} won by ${10 - b.wickets} wickets`; }
    else { winnerId = a.battingTeamId; result = `${teamById(a.battingTeamId)!.name} won by ${a.runs - b.runs} runs`; }
    statusLine = result;
  }

  // Commentary and recent overs of the innings in play (latest first)
  const liveBalls = r2 > 0 ? i2.slice(0, r2) : i1.slice(0, r1);
  const inningsNo = r2 > 0 ? 2 : 1;
  const commentary = commentaryFor(liveBalls, inningsNo).reverse().slice(0, 60);
  const byOver = new Map<number, { balls: string[]; runs: number }>();
  liveBalls.forEach((b) => {
    const o = byOver.get(b.over) ?? { balls: [], runs: 0 };
    o.balls.push(b.wicket ? 'W' : b.extra ? 'wd' : String(b.runs)); o.runs += b.runs; byOver.set(b.over, o);
  });
  const recentOvers = [...byOver.entries()].slice(-3).map(([over, v]) => ({ over: over + 1, ...v }));

  let winProb: MatchView['winProb'];
  if (def.status === 'live' && def.format !== 'TEST') {
    const cur = innings[innings.length - 1];
    let p = 0.5;
    if (innings.length === 2 && target) {
      const ballsLeft = maxOvers(def.format) * 6 - cur.ballsBowled;
      const need = target - cur.runs, rrr = ballsLeft ? (need / ballsLeft) * 6 : 99;
      p = 1 / (1 + Math.exp((rrr - cur.runRate - (10 - cur.wickets) * -0.15) * 0.45 + (cur.wickets - 3) * 0.12));
      winProb = { team1: bat2Team.id === t1.id ? p : 1 - p, team2: bat2Team.id === t1.id ? 1 - p : p };
    } else {
      const par = def.format === 'T20' ? 8.2 : def.format === 'T10' ? 10.5 : 5.8;
      p = Math.min(0.8, Math.max(0.2, 0.5 + (cur.runRate - par) * 0.05 - cur.wickets * 0.02));
      winProb = { team1: batFirst.id === t1.id ? p : 1 - p, team2: batFirst.id === t1.id ? 1 - p : p };
    }
  }

  const title = `${t1.code} vs ${t2.code}, ${def.label}`;
  return {
    id: def.id, slug: `${t1.code}-vs-${t2.code}-${def.label}-${s.short}-${def.id}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    seriesId: s.id, title, format: def.format, status: def.status, team1Id: t1.id, team2Id: t2.id,
    venue: def.venue, city: def.city, startTime: new Date(start).toISOString(),
    toss: `${tossWinner.name} won the toss and elected to ${tossWinner.id === batFirst.id ? 'bat' : 'bowl'} first`,
    innings, result, statusLine, winProb, commentary, recentOvers, umpires: ['R. Kettleborough', 'M. Gough'], winnerId,
  };
}

export const demoProvider: CricketProvider = {
  listMatches: () => { const now = Date.now(); return defs.map((d) => build(d, now)); },
  getMatch: (id) => { const d = defs.find((x) => x.id === id); return d ? build(d, Date.now()) : undefined; },
};

export const matchIdFromSlug = (slug: string) => slug.split('-').pop()!.toUpperCase();
export const allMatches = () => demoProvider.listMatches();
export const getMatch = (id: string) => demoProvider.getMatch(id);
export const matchesBySeries = (seriesId: string) => allMatches().filter((m) => m.seriesId === seriesId);
export const matchesByTeam = (teamId: string) => allMatches().filter((m) => m.team1Id === teamId || m.team2Id === teamId);
export { series, playerById, slugify };
