import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { teams } from '@apex/core';

const team = (id: number, name: string, code: string, national = false) => ({ id, name, code, national_team: national });
const league = { id: 1, name: 'Test League', code: 'TL', type: 'league' };
const fixture = (over: Record<string, unknown>) => ({
  id: 100, league_id: 1, season_id: 55, round: 'Final', localteam_id: 1, visitorteam_id: 2, starting_at: '2026-11-14T16:30:00.000000Z', type: 'T20',
  status: 'Finished', note: 'Alpha won by 10 runs', venue_id: 9, toss_won_team_id: 2, elected: 'bowling', winner_team_id: 1,
  localteam: team(1, 'Alpha Kings', 'ALP'), visitorteam: team(2, 'Beta Royals', 'BET'), league, venue: { name: 'Big Ground', city: 'Town' },
  runs: [{ team_id: 1, inning: 1, score: 150, wickets: 6, overs: 20 }, { team_id: 2, inning: 2, score: 140, wickets: 9, overs: 20 }], ...over,
});

beforeEach(() => { process.env.SPORTMONKS_TOKEN = 'test-token'; });
afterEach(() => { vi.unstubAllGlobals(); });

function stub(data: unknown, headers: Record<string, string> = { 'x-ratelimit-remaining': '170', 'x-ratelimit-limit': '180' }) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data }), { status: 200, headers }));
  vi.stubGlobal('fetch', fetchMock); return fetchMock;
}

describe('Sportmonks mapping', () => {
  it('maps fixtures to matches, registers teams/series, drops TBC fixtures, and records rate-limit headers', async () => {
    const sm = await import('../src');
    stub([fixture({}), fixture({ id: 101, status: 'NS', runs: [], localteam: team(3, 'TBC', 'TBC'), visitorteam: team(4, 'TBC', 'TBC') }), fixture({ id: 102, status: '2nd Innings', note: '' })]);
    const list = await sm.smListMatches({ ttl: 0 });
    expect(list.map((m) => m.id)).toEqual(['100', '102']); // TBC v TBC dropped
    const m = list[0];
    expect(m).toMatchObject({ status: 'completed', format: 'T20', result: 'Alpha won by 10 runs', venue: 'Big Ground', city: 'Town', title: 'ALP vs BET, Final' });
    expect(teams.some((t) => t.name === 'Alpha Kings' && t.code === 'ALP')).toBe(true);
    expect(m.innings.map((i) => [i.runs, i.wickets, i.overs])).toEqual([[150, 6, '20.0'], [140, 9, '20.0']]);
    expect(m.innings[1].target).toBe(151);
    expect(m.winnerId).toBe(m.team1Id);
    expect(list[1].status).toBe('live');
    expect(sm.getApiStats()).toMatchObject({ remaining: 170, limit: 180 });
    expect(sm.exportRegistry().series.some((s) => s.id === 'tl-55')).toBe(true);
  });

  it('caches calls within the TTL and bypasses with ttl=0', async () => {
    const sm = await import('../src');
    const f = stub([fixture({ id: 200 })]);
    await sm.smListMatches({ ttl: 600 }); const after1 = f.mock.calls.length;
    await sm.smListMatches({ ttl: 600 }); expect(f.mock.calls.length).toBe(after1); // served from cache
    await sm.smListMatches({ ttl: 0 }); expect(f.mock.calls.length).toBe(after1 + 1);
  });

  it('rejects non-numeric match ids without calling the API, and surfaces HTTP errors', async () => {
    const sm = await import('../src');
    const f = stub([]);
    expect(await sm.smGetMatch('1; drop table')).toBeUndefined(); expect(f).not.toHaveBeenCalled();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })));
    await expect(sm.smListMatches({ ttl: 0 })).rejects.toMatchObject({ status: 429 });
  });

  it('aggregates career seasons per format', async () => {
    const sm = await import('../src');
    stub({ career: [
      { type: 'ODI', batting: { matches: 10, innings: 10, runs_scored: 500, not_outs: 2, balls_faced: 600, highest_inning_score: 110, four_x: 40, six_x: 5, hundreds: 1, fifties: 3 }, bowling: null },
      { type: 'ODI', batting: { matches: 5, innings: 5, runs_scored: 250, not_outs: 0, balls_faced: 300, highest_inning_score: 90, four_x: 20, six_x: 2, hundreds: 0, fifties: 2 }, bowling: { matches: 5, innings: 4, overs: 20, runs: 100, wickets: 4, five_wickets: 0 } },
      { type: 'Test/5day', batting: { matches: 2, innings: 3, runs_scored: 60, not_outs: 0, balls_faced: 120, highest_inning_score: 40 }, bowling: null },
    ] });
    const c = await sm.smCareer(1);
    const odi = c.find((x) => x.format === 'ODI')!;
    expect(odi).toMatchObject({ matches: 15, runs: 750, highest: 110, hundreds: 1, fifties: 5, wickets: 4 });
    expect(odi.avg).toBeCloseTo(750 / 13, 2); expect(odi.sr).toBeCloseTo((750 / 900) * 100, 1); expect(odi.econ).toBe(5);
    expect(c.find((x) => x.format === 'Test')?.matches).toBe(2); // 'Test/5day' normalised
  });
});
