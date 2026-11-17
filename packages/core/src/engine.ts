import type { Ball, BatLine, BowlLine, CommentaryItem, Format, InningsView, Player } from './types';
import { rng } from './rng';
import { playerById } from './players';

const CFG: Record<Format, { overs: number; bowlerMax: number; dot: number; one: number; two: number; four: number; six: number; wkt: number; wide: number }> = {
  T10: { overs: 10, bowlerMax: 2, dot: 0.25, one: 0.3, two: 0.08, four: 0.15, six: 0.1, wkt: 0.06, wide: 0.04 },
  T20: { overs: 20, bowlerMax: 4, dot: 0.3, one: 0.33, two: 0.06, four: 0.12, six: 0.06, wkt: 0.045, wide: 0.03 },
  ODI: { overs: 50, bowlerMax: 10, dot: 0.4, one: 0.34, two: 0.06, four: 0.09, six: 0.03, wkt: 0.028, wide: 0.02 },
  TEST: { overs: 90, bowlerMax: 30, dot: 0.6, one: 0.22, two: 0.04, four: 0.07, six: 0.012, wkt: 0.02, wide: 0.004 },
};
export const maxOvers = (f: Format) => CFG[f].overs;

const KINDS = ['caught', 'bowled', 'lbw', 'caught behind', 'run out', 'stumped'];

export function simulateInnings(seed: number, batters: Player[], bowlingSide: Player[], format: Format, target?: number): Ball[] {
  const r = rng(seed);
  const c = CFG[format];
  const bowlers = bowlingSide.filter((p) => p.role === 'Bowler' || p.role === 'All-rounder').slice(-5);
  const balls: Ball[] = [];
  let striker = 0, non = 1, next = 2, wkts = 0, runs = 0;
  const oversBy: Record<string, number> = {};
  let prevBowler = '';
  for (let over = 0; over < c.overs && wkts < 10; over++) {
    const avail = bowlers.filter((b) => b.id !== prevBowler && (oversBy[b.id] ?? 0) < c.bowlerMax);
    const bowler = (avail.length ? avail : bowlers)[Math.floor(r() * (avail.length ? avail.length : bowlers.length))];
    oversBy[bowler.id] = (oversBy[bowler.id] ?? 0) + 1;
    prevBowler = bowler.id;
    // powerplay / death boosts for limited overs
    const boost = format === 'TEST' ? 1 : over < 6 ? 1.15 : over >= c.overs - 4 ? 1.35 : 1;
    let legal = 0;
    while (legal < 6 && wkts < 10) {
      const x = r();
      const b: Ball = { over, ball: legal + 1, batterId: batters[striker].id, bowlerId: bowler.id, runs: 0 };
      const wide = r() < c.wide;
      if (wide) { b.extra = 'wd'; b.runs = 1; balls.push(b); runs += 1; if (target && runs >= target) return balls; continue; }
      const pw = c.wkt * (boost > 1.2 ? 1.4 : 1);
      if (x < pw) {
        const kind = KINDS[Math.floor(r() * KINDS.length)];
        b.wicket = { kind, playerId: batters[striker].id };
        wkts++; legal++; balls.push(b);
        if (next < batters.length) striker = next++; else break;
      } else {
        const y = r();
        let rn = 0;
        const dot = c.dot / boost, one = c.one, two = c.two, four = c.four * boost, six = c.six * boost;
        if (y < dot) rn = 0; else if (y < dot + one) rn = 1; else if (y < dot + one + two) rn = 2; else if (y < dot + one + two + four) rn = 4; else if (y < dot + one + two + four + six) rn = 6; else rn = 1;
        b.runs = rn; legal++; runs += rn; balls.push(b);
        if (rn % 2 === 1) [striker, non] = [non, striker];
        if (target && runs >= target) return balls;
      }
    }
    [striker, non] = [non, striker];
  }
  return balls;
}

const oversStr = (legal: number) => `${Math.floor(legal / 6)}.${legal % 6}`;

export function viewInnings(all: Ball[], upTo: number, batters: Player[], bowlingSide: Player[], battingTeamId: string, format: Format, fullLen: number, target?: number): InningsView {
  const balls = all.slice(0, upTo);
  const bat = new Map<string, BatLine>();
  const bowl = new Map<string, { legal: number; runs: number; wk: number; perOver: Record<number, number> }>();
  const fow: InningsView['fallOfWickets'] = [];
  let runs = 0, wk = 0, legal = 0, extras = 0, pRuns = 0, pBalls = 0;
  batters.forEach((p) => bat.set(p.id, { playerId: p.id, runs: 0, balls: 0, fours: 0, sixes: 0 }));
  const faced = new Set<string>();
  for (const b of balls) {
    const bl = bowl.get(b.bowlerId) ?? { legal: 0, runs: 0, wk: 0, perOver: {} };
    bowl.set(b.bowlerId, bl);
    runs += b.runs; pRuns += b.runs; bl.runs += b.runs; bl.perOver[b.over] = (bl.perOver[b.over] ?? 0) + b.runs;
    if (b.extra) { extras += b.runs; continue; }
    legal++; pBalls++; bl.legal++;
    const line = bat.get(b.batterId)!; faced.add(b.batterId);
    line.runs += b.runs; line.balls++;
    if (b.runs === 4) line.fours++; if (b.runs === 6) line.sixes++;
    if (b.wicket) {
      wk++; bl.wk++; pRuns = 0; pBalls = 0;
      const bowlerName = playerById(b.bowlerId)?.name ?? '';
      line.out = b.wicket.kind === 'run out' ? 'run out' : `${b.wicket.kind} b ${bowlerName}`;
      fow.push({ runs, wicket: wk, playerId: b.wicket.playerId, over: `${b.over}.${b.ball}` });
    }
  }
  const complete = upTo >= fullLen && fullLen > 0;
  const outIds = new Set(batters.filter((p) => bat.get(p.id)!.out).map((p) => p.id));
  const atCrease = batters.filter((p) => !outIds.has(p.id)).slice(0, 2);
  const batting = batters.filter((p) => faced.has(p.id) || atCrease.some((a) => a.id === p.id) && upTo > 0).map((p) => ({ ...bat.get(p.id)!, onStrike: !complete && atCrease[0]?.id === p.id && !outIds.has(p.id) }));
  const bowling: BowlLine[] = [...bowl.entries()].map(([id, v]) => ({
    playerId: id, overs: oversStr(v.legal), maidens: Object.values(v.perOver).filter((x) => x === 0).length, runs: v.runs, wickets: v.wk,
    econ: v.legal ? +(v.runs / (v.legal / 6)).toFixed(2) : 0,
  }));
  return { battingTeamId, runs, wickets: wk, overs: oversStr(legal), ballsBowled: legal, runRate: legal ? +(runs / (legal / 6)).toFixed(2) : 0, batting, bowling, fallOfWickets: fow, extras, complete, target, partnership: { runs: pRuns, balls: pBalls } };
}

export function commentaryFor(balls: Ball[], inningsNo: number): CommentaryItem[] {
  const out: CommentaryItem[] = [];
  const n = (id: string) => playerById(id)?.name ?? 'Batter';
  const tmpl = {
    0: ['defended solidly', 'beaten outside off', 'pushed to the fielder, no run', 'left alone'],
    1: ['worked into the gap for a single', 'nudged away for one', 'dabbed to point, they scamper through'],
    2: ['placed beautifully, they come back for two', 'finds the gap, two runs'],
    4: ['crunched through the covers, FOUR', 'races to the rope, FOUR', 'timed to perfection, FOUR'],
    6: ['launched over long-on, SIX', 'out of the ground, SIX', 'smoked down the ground, SIX'],
  } as Record<number, string[]>;
  balls.forEach((b, i) => {
    const t = tmpl[b.runs] ?? tmpl[1];
    const pick = t[(i * 7 + b.over) % t.length];
    const label = `${b.over}.${b.ball}`;
    if (b.extra) out.push({ id: `${inningsNo}-${i}`, over: label, text: `${n(b.bowlerId)} to ${n(b.batterId)}, wide, ${b.runs} run`, runs: b.runs, kind: 'ball' });
    else if (b.wicket) out.push({ id: `${inningsNo}-${i}`, over: label, text: `WICKET! ${n(b.bowlerId)} to ${n(b.batterId)}, ${b.wicket.kind}. The batter has to go.`, runs: 0, kind: 'wicket' });
    else out.push({ id: `${inningsNo}-${i}`, over: label, text: `${n(b.bowlerId)} to ${n(b.batterId)}, ${pick}`, runs: b.runs, kind: b.runs === 4 ? 'four' : b.runs === 6 ? 'six' : 'ball' });
  });
  return out;
}
