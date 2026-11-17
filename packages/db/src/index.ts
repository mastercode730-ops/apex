import { Pool, type PoolConfig } from 'pg';
import { toListView, type Article, type CareerLine, type MatchView, type Player, type RankingEntry, type Series, type Team } from '@apex/core';
import { migrations } from './migrations';

// ---------- connection ----------
let pool: Pool | undefined;
export function dbConfigured() { return !!process.env.DATABASE_URL; }
export function getPool(cfg: PoolConfig = {}): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    pool = new Pool({ connectionString: url, max: Number(process.env.PG_POOL_MAX ?? 10), ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined, ...cfg });
    pool.on('error', (e) => console.error('[db] idle client error', e.message));
  }
  return pool;
}
export async function closePool() { await pool?.end(); pool = undefined; }
const q = <T = any>(text: string, params: unknown[] = []) => getPool().query(text, params).then((r) => r.rows as T[]);

export async function migrate(): Promise<string[]> {
  const p = getPool();
  await p.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const done = new Set((await p.query('select name from schema_migrations')).rows.map((r) => r.name));
  const applied: string[] = [];
  for (const m of migrations) {
    if (done.has(m.name)) continue;
    const c = await p.connect();
    try { await c.query('begin'); await c.query(m.sql); await c.query('insert into schema_migrations(name) values ($1)', [m.name]); await c.query('commit'); applied.push(m.name); }
    catch (e) { await c.query('rollback'); throw e; } finally { c.release(); }
  }
  return applied;
}

// ---------- registry (teams / players / series) ----------
export async function upsertTeams(rows: { smId: number; team: Team }[]) {
  for (const r of rows) await q(`insert into teams (id, sm_id, data) values ($1,$2,$3) on conflict (id) do update set sm_id = excluded.sm_id, data = excluded.data, updated_at = now()`, [r.team.id, r.smId, r.team]);
}
export async function upsertPlayers(rows: { smId: number; player: Player }[]) {
  for (const r of rows) await q(`insert into players (id, sm_id, data) values ($1,$2,$3) on conflict (id) do update set sm_id = excluded.sm_id, data = excluded.data, updated_at = now()`, [r.player.id, r.smId, r.player]);
}
export async function upsertSeries(list: Series[]) {
  for (const s of list) await q(`insert into series (id, data) values ($1,$2) on conflict (id) do update set data = excluded.data, updated_at = now()`, [s.id, s]);
}
export async function loadRegistryRows() {
  const [t, p, s] = await Promise.all([q('select data from teams'), q('select data from players'), q('select data from series')]);
  return { teams: t.map((r) => r.data as Team), players: p.map((r) => r.data as Player), series: s.map((r) => r.data as Series) };
}

// ---------- matches ----------
/** List-level upsert from the fixtures feed. Never touches stored detail. */
export async function upsertMatchList(list: MatchView[]) {
  for (const m of list) {
    await q(`insert into matches (id, slug, series_id, status, starts_at, data) values ($1,$2,$3,$4,$5,$6)
             on conflict (id) do update set slug = excluded.slug, series_id = excluded.series_id, status = excluded.status, starts_at = excluded.starts_at, data = excluded.data, updated_at = now()`,
      [m.id, m.slug, m.seriesId, m.status, m.startTime, toListView(m)]);
  }
}
/** Full detail upsert; also refreshes the list-level view so lists show the latest score. */
export async function upsertMatchDetail(m: MatchView) {
  await q(`insert into matches (id, slug, series_id, status, starts_at, data, detail, detail_at) values ($1,$2,$3,$4,$5,$6,$7,now())
           on conflict (id) do update set slug = excluded.slug, series_id = excluded.series_id, status = excluded.status, starts_at = excluded.starts_at,
             data = excluded.data, detail = excluded.detail, detail_at = now(), updated_at = now()`,
    [m.id, m.slug, m.seriesId, m.status, m.startTime, toListView(m), m]);
}
export async function listMatchRows(from: Date, to: Date): Promise<MatchView[]> {
  return (await q('select data from matches where starts_at between $1 and $2 order by starts_at asc', [from, to])).map((r) => r.data as MatchView);
}
export async function listMatchRowsBySeries(seriesId: string): Promise<MatchView[]> {
  return (await q('select data from matches where series_id = $1 order by starts_at asc', [seriesId])).map((r) => r.data as MatchView);
}
export async function listMatchRowsByTeam(teamId: string, limit = 80): Promise<MatchView[]> {
  return (await q(`select data from matches where data->>'team1Id' = $1 or data->>'team2Id' = $1 order by starts_at desc limit $2`, [teamId, limit])).map((r) => r.data as MatchView).reverse();
}
export async function getMatchRow(id: string): Promise<MatchView | undefined> {
  const r = (await q('select data, detail from matches where id = $1', [id]))[0];
  return r ? ((r.detail ?? r.data) as MatchView) : undefined;
}
export async function completedDetails(seriesId?: string, limit = 400): Promise<MatchView[]> {
  const rows = seriesId
    ? await q(`select detail from matches where status = 'completed' and detail is not null and series_id = $1 order by starts_at desc limit $2`, [seriesId, limit])
    : await q(`select detail from matches where status = 'completed' and detail is not null order by starts_at desc limit $1`, [limit]);
  return rows.map((r) => r.detail as MatchView);
}
export const liveMatchIds = async () => (await q(`select id from matches where status = 'live'`)).map((r) => r.id as string);
/** Completed matches whose stored detail is missing or was captured while the match was still live. */
export async function matchesNeedingDetail(limit: number) {
  return (await q(`select id from matches where status = 'completed' and starts_at > now() - interval '30 days'
                   and (detail is null or detail->>'status' <> 'completed') order by starts_at desc limit $1`, [limit])).map((r) => r.id as string);
}

// ---------- rankings ----------
export async function saveRanking(gender: string, kind: string, format: string, entries: RankingEntry[]) {
  await q(`insert into rankings (gender, kind, format, data) values ($1,$2,$3,$4) on conflict (gender, kind, format) do update set data = excluded.data, updated_at = now()`, [gender, kind, format, JSON.stringify(entries)]);
}
export async function getRanking(gender: string, kind: string, format: string): Promise<RankingEntry[] | undefined> {
  return (await q('select data from rankings where gender = $1 and kind = $2 and format = $3', [gender, kind, format]))[0]?.data;
}

// ---------- careers ----------
export async function playersNeedingCareer(limit: number, staleDays = 14) {
  return (await q(`select id, sm_id from players where sm_id is not null and (career_at is null or career_at < now() - ($2 || ' days')::interval) order by career_at nulls first limit $1`, [limit, String(staleDays)]))
    .map((r) => ({ id: r.id as string, smId: r.sm_id as number }));
}
export async function saveCareer(playerId: string, lines: CareerLine[]) {
  await q('update players set career = $2, career_at = now() where id = $1', [playerId, JSON.stringify(lines)]);
}
export async function getCareerRow(playerId: string): Promise<CareerLine[] | undefined> {
  const r = (await q('select career from players where id = $1', [playerId]))[0]; return r?.career ?? undefined;
}

// ---------- articles ----------
const toArticle = (r: any): Article => ({ id: r.id, slug: r.slug, category: r.category, title: r.title, excerpt: r.excerpt, body: r.body, author: r.author, publishedAt: new Date(r.published_at).toISOString(), seriesId: r.series_id ?? undefined, teamIds: r.team_ids });
export async function listArticleRows(opts: { category?: string; limit?: number } = {}): Promise<Article[]> {
  const rows = opts.category
    ? await q('select * from articles where category = $1 order by published_at desc limit $2', [opts.category, opts.limit ?? 50])
    : await q('select * from articles order by published_at desc limit $1', [opts.limit ?? 50]);
  return rows.map(toArticle);
}
export async function getArticleRow(slug: string) { const r = (await q('select * from articles where slug = $1', [slug]))[0]; return r ? toArticle(r) : undefined; }
export async function upsertArticleRow(a: Omit<Article, 'publishedAt'> & { publishedAt?: string }) {
  await q(`insert into articles (id, slug, category, title, excerpt, body, author, series_id, team_ids, published_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,coalesce($10::timestamptz, now()))
           on conflict (id) do update set slug = excluded.slug, category = excluded.category, title = excluded.title, excerpt = excluded.excerpt, body = excluded.body,
             author = excluded.author, series_id = excluded.series_id, team_ids = excluded.team_ids`,
    [a.id, a.slug, a.category, a.title, a.excerpt, JSON.stringify(a.body), a.author, a.seriesId ?? null, a.teamIds ?? [], a.publishedAt ?? null]);
}
export async function deleteArticleRow(id: string) { await q('delete from articles where id = $1', [id]); }

// ---------- misc ----------
export async function saveContact(name: string, email: string, message: string) { await q('insert into contact_messages (name, email, message) values ($1,$2,$3)', [name, email, message]); }
export async function setState(key: string, value: unknown) { await q(`insert into sync_state (key, value) values ($1,$2) on conflict (key) do update set value = excluded.value, updated_at = now()`, [key, JSON.stringify(value)]); }
export async function getState<T = any>(key: string): Promise<{ value: T; updatedAt: Date } | undefined> {
  const r = (await q('select value, updated_at from sync_state where key = $1', [key]))[0]; return r ? { value: r.value as T, updatedAt: r.updated_at } : undefined;
}
export async function ping() { await q('select 1'); return true; }
