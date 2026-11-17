/** Ordered, append-only migrations. Never edit an applied migration; add a new one. */
export const migrations: { name: string; sql: string }[] = [
  {
    name: '001_init',
    sql: `
create table if not exists teams (
  id text primary key, sm_id integer unique, data jsonb not null, updated_at timestamptz not null default now()
);
create table if not exists players (
  id text primary key, sm_id integer unique, data jsonb not null,
  career jsonb, career_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists series (
  id text primary key, data jsonb not null, updated_at timestamptz not null default now()
);
-- data   = list-level view (no scorecard/commentary), small and cheap to list
-- detail = full MatchView (scorecard, commentary), fetched per match
create table if not exists matches (
  id text primary key, slug text unique not null, series_id text,
  status text not null check (status in ('upcoming','live','completed')),
  starts_at timestamptz not null, data jsonb not null,
  detail jsonb, detail_at timestamptz, updated_at timestamptz not null default now()
);
create index if not exists matches_status_start on matches (status, starts_at);
create index if not exists matches_series on matches (series_id);
create table if not exists rankings (
  gender text not null, kind text not null, format text not null, data jsonb not null,
  updated_at timestamptz not null default now(), primary key (gender, kind, format)
);
create table if not exists articles (
  id text primary key, slug text unique not null,
  category text not null check (category in ('news','records','analysis','prediction','reactions','listicles','stories')),
  title text not null, excerpt text not null default '', body jsonb not null default '[]'::jsonb, author text not null default 'Apex Desk',
  series_id text, team_ids text[] not null default '{}', published_at timestamptz not null default now()
);
create index if not exists articles_published on articles (published_at desc);
create table if not exists contact_messages (
  id bigserial primary key, name text not null, email text not null, message text not null, created_at timestamptz not null default now()
);
create table if not exists sync_state (
  key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);
`,
  },
];
