import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { demoProvider } from '@apex/core';

let server: PGLiteSocketServer, pg: PGlite, db: typeof import('../src');

beforeAll(async () => {
  pg = await PGlite.create();
  server = new PGLiteSocketServer({ db: pg, port: 5544, host: '127.0.0.1', maxConnections: 5 });
  await server.start();
  process.env.DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:5544/postgres';
  db = await import('../src');
});
afterAll(async () => { await db.closePool(); await server.stop(); await pg.close(); });

describe('migrations', () => {
  it('applies once and is idempotent', async () => {
    expect(await db.migrate()).toEqual(['001_init']);
    expect(await db.migrate()).toEqual([]);
  });
});

describe('matches', () => {
  const done = { ...demoProvider.getMatch('B1')!, id: '9001', slug: 'x-9001' };
  const live = { ...demoProvider.getMatch('A1')!, id: '9002', slug: 'x-9002' };
  it('stores list-level data separately from detail and finds matches needing detail', async () => {
    await db.upsertMatchList([done, live]);
    expect((await db.getMatchRow('9001'))!.innings[0].batting).toEqual([]); // list view only
    expect(await db.matchesNeedingDetail(10)).toEqual(['9001']);          // completed without detail
    expect(await db.liveMatchIds()).toEqual(['9002']);
    await db.upsertMatchDetail(done);
    expect((await db.getMatchRow('9001'))!.innings[0].batting.length).toBeGreaterThan(0);
    expect(await db.matchesNeedingDetail(10)).toEqual([]);
    // a list refresh must not erase stored detail
    await db.upsertMatchList([done]);
    expect((await db.getMatchRow('9001'))!.innings[0].batting.length).toBeGreaterThan(0);
    expect((await db.completedDetails()).map((m) => m.id)).toEqual(['9001']);
  });
  it('re-fetches detail that was captured while the match was still live', async () => {
    await db.upsertMatchDetail({ ...live, status: 'live' });
    await db.upsertMatchList([{ ...live, status: 'completed' }]);
    expect(await db.matchesNeedingDetail(10)).toContain('9002');
  });
  it('lists by window, series and team', async () => {
    const from = new Date(Date.now() - 30 * 864e5), to = new Date(Date.now() + 30 * 864e5);
    expect((await db.listMatchRows(from, to)).length).toBeGreaterThan(0);
    expect((await db.listMatchRowsBySeries(done.seriesId)).length).toBeGreaterThan(0);
    expect((await db.listMatchRowsByTeam(done.team1Id)).length).toBeGreaterThan(0);
  });
});

describe('registry, rankings, careers, articles, state', () => {
  it('round-trips registry rows', async () => {
    await db.upsertTeams([{ smId: 1, team: { id: 't1', code: 'T1', name: 'Team One', color: '#000', board: '', since: 0, bio: '' } }]);
    await db.upsertPlayers([{ smId: 7, player: { id: 'p-one', name: 'P One', teamId: 't1', role: 'Batter', battingStyle: 'Right', bowlingStyle: '-', born: '1990' } }]);
    const r = await db.loadRegistryRows();
    expect(r.teams.map((t) => t.id)).toContain('t1'); expect(r.players[0].name).toBe('P One');
  });
  it('queues players for career sync and stores them', async () => {
    expect(await db.playersNeedingCareer(5)).toEqual([{ id: 'p-one', smId: 7 }]);
    await db.saveCareer('p-one', [{ format: 'ODI', matches: 3 } as any]);
    expect(await db.playersNeedingCareer(5)).toEqual([]);
    expect((await db.getCareerRow('p-one'))![0].matches).toBe(3);
  });
  it('stores rankings', async () => {
    await db.saveRanking('men', 'team', 'T20', [{ rank: 1, prev: 1, teamId: 't1', name: 'Team One', rating: 250 }]);
    expect((await db.getRanking('men', 'team', 'T20'))![0].rating).toBe(250);
    expect(await db.getRanking('women', 'team', 'T20')).toBeUndefined();
  });
  it('supports article CRUD with categories enforced by the schema', async () => {
    await db.upsertArticleRow({ id: 'a1', slug: 'a1', category: 'news', title: 'Hello world', excerpt: 'x', body: ['p1', 'p2'], author: 'Me' });
    expect((await db.getArticleRow('a1'))!.body).toEqual(['p1', 'p2']);
    expect((await db.listArticleRows({ category: 'news' })).length).toBe(1);
    await expect(db.upsertArticleRow({ id: 'bad', slug: 'bad', category: 'nonsense' as any, title: 't', excerpt: '', body: [], author: '' })).rejects.toThrow();
    await db.deleteArticleRow('a1'); expect(await db.getArticleRow('a1')).toBeUndefined();
  });
  it('stores contact messages and worker state', async () => {
    await db.saveContact('A', 'a@b.co', 'hello there friend');
    await db.setState('worker', { at: new Date().toISOString() });
    expect((await db.getState<{ at: string }>('worker'))!.value.at).toBeTruthy();
    expect(await db.ping()).toBe(true);
  });
});
