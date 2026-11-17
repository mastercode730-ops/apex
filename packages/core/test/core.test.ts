import { describe, expect, it } from 'vitest';
import { computeLeaders, demoProvider, loadRegistry, pointsTable, teamById, teams, toListView, type MatchView } from '../src';

const inn = (battingTeamId: string, runs: number, wickets: number, ballsBowled: number, batting: any[] = [], bowling: any[] = []) =>
  ({ battingTeamId, runs, wickets, overs: '', ballsBowled, runRate: 0, batting, bowling, fallOfWickets: [], extras: 0, complete: true, partnership: { runs: 0, balls: 0 } });

describe('pointsTable', () => {
  it('awards 2 points per win, 1 for no result, and computes real NRR', () => {
    const rows = pointsTable(['a', 'b', 'c'], [
      { team1Id: 'a', team2Id: 'b', winnerId: 'a', format: 'T20', innings: [inn('a', 180, 5, 120), inn('b', 150, 10, 100)] },
      { team1Id: 'b', team2Id: 'c' }, // abandoned
    ]);
    const by = Object.fromEntries(rows.map((r) => [r.teamId, r]));
    expect(by.a).toMatchObject({ played: 1, won: 1, points: 2 });
    expect(by.b).toMatchObject({ played: 2, lost: 1, noResult: 1, points: 1 });
    expect(by.c).toMatchObject({ played: 1, noResult: 1, points: 1 });
    // a: 180/20 - 150/20 (b all out in 100 balls counts as the full 120-ball quota) = 1.5
    expect(by.a.nrr).toBeCloseTo(1.5, 2);
    expect(rows[0].teamId).toBe('a');
  });
});

describe('computeLeaders', () => {
  const m = {
    id: '1', team1Id: 'a', team2Id: 'b',
    innings: [
      inn('a', 200, 3, 120, [{ playerId: 'p1', runs: 104, balls: 50, fours: 8, sixes: 6 }, { playerId: 'p2', runs: 52, balls: 30, fours: 5, sixes: 1 }], []),
      inn('b', 150, 8, 120, [{ playerId: 'p3', runs: 70, balls: 60, fours: 4, sixes: 2 }], [{ playerId: 'p4', wickets: 3 }]),
    ],
  } as unknown as MatchView;
  it('ranks runs, hundreds, fifties and bowling wickets from scorecards', () => {
    expect(computeLeaders([m], 'most-runs')[0]).toMatchObject({ playerId: 'p1', value: 104, rank: 1, teamId: 'a' });
    expect(computeLeaders([m], 'most-hundreds').map((r) => r.playerId)).toEqual(['p1']);
    expect(computeLeaders([m], 'most-fifties').map((r) => r.playerId).sort()).toEqual(['p2', 'p3']);
    expect(computeLeaders([m], 'most-wickets')[0]).toMatchObject({ playerId: 'p4', teamId: 'a', value: 3 }); // bowler p4 is in the fielding side
  });
  it('requires 30+ balls for strike rate and rejects unknown categories', () => {
    expect(computeLeaders([m], 'highest-strike-rate')[0]).toMatchObject({ playerId: 'p1' });
    expect(computeLeaders([m], 'nope')).toEqual([]);
  });
});

describe('demo engine', () => {
  it('is deterministic for completed matches and produces consistent scorecards', () => {
    const a = demoProvider.getMatch('B1')!, b = demoProvider.getMatch('B1')!;
    expect(a.innings.map((i) => [i.runs, i.wickets])).toEqual(b.innings.map((i) => [i.runs, i.wickets]));
    expect(a.status).toBe('completed'); expect(a.winnerId).toBeTruthy();
    for (const i of a.innings) expect(i.batting.reduce((s, x) => s + x.runs, 0) + i.extras).toBe(i.runs);
  });
});

describe('registry + list view', () => {
  it('loads stored entries over built-ins and strips heavy fields for lists', () => {
    loadRegistry({ teams: [{ ...teams[0], name: 'India (db)' }, { id: 'xyz', code: 'XYZ', name: 'Xyz', color: '#fff', board: '', since: 0, bio: '' }], players: [], series: [] });
    expect(teamById('ind')?.name).toBe('India (db)'); expect(teamById('xyz')).toBeTruthy();
    const full = demoProvider.getMatch('B1')!;
    const lite = toListView(full);
    expect(lite.commentary).toEqual([]); expect(lite.innings[0].batting).toEqual([]); expect(lite.innings[0].runs).toBe(full.innings[0].runs);
  });
});
