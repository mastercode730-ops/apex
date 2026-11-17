-- Apex database schema (PostgreSQL / Neon). Vendor-neutral: every row carries
-- (source, source_id) so a different data vendor can be swapped without losing history.
-- Apply with: psql "$DATABASE_URL" -f db/schema.sql

create extension if not exists pg_trgm;

create table if not exists teams (
  id           text primary key,                -- slug, e.g. 'ind'
  code         text not null,
  name         text not null,
  is_women     boolean not null default false,
  board        text, since_year int, bio text, color text,
  source text, source_id text,
  unique (source, source_id)
);

create table if not exists players (
  id           text primary key,                -- slug, e.g. 'virat-kohli'
  name         text not null,
  team_id      text references teams(id),
  role         text check (role in ('Batter','Bowler','All-rounder','Wicketkeeper')),
  batting_style text, bowling_style text, born date, photo_url text,
  source text, source_id text,
  unique (source, source_id)
);
create index if not exists players_name_trgm on players using gin (name gin_trgm_ops);

create table if not exists series (
  id           text primary key,
  name         text not null, short_name text not null,
  kind         text check (kind in ('International','League','Domestic')),
  formats      text[] not null,
  starts_on    date, ends_on date,
  source text, source_id text,
  unique (source, source_id)
);
create table if not exists series_teams (
  series_id text references series(id) on delete cascade,
  team_id   text references teams(id),
  primary key (series_id, team_id)
);

create table if not exists matches (
  id           text primary key,                -- short id used in URLs
  slug         text unique not null,
  series_id    text references series(id),
  label        text not null,                   -- '1st T20'
  format       text not null check (format in ('T10','T20','ODI','TEST')),
  status       text not null check (status in ('upcoming','live','completed')),
  team1_id     text references teams(id), team2_id text references teams(id),
  venue        text, city text,
  starts_at    timestamptz not null,
  toss         text, result text, winner_id text references teams(id),
  umpires      text[],
  updated_at   timestamptz not null default now(),
  source text, source_id text,
  unique (source, source_id)
);
create index if not exists matches_status_start on matches (status, starts_at);
create index if not exists matches_series on matches (series_id);

create table if not exists innings (
  match_id     text references matches(id) on delete cascade,
  number       int not null,
  batting_team text references teams(id),
  runs int not null default 0, wickets int not null default 0,
  balls_bowled int not null default 0, extras int not null default 0,
  target int, complete boolean not null default false,
  primary key (match_id, number)
);

-- Ball-by-ball is the source of truth; scorecards and commentary can be derived from it.
create table if not exists deliveries (
  match_id text, innings int, seq int,           -- seq = delivery order within innings
  over int not null, ball int not null,
  batter_id text, bowler_id text, runs int not null default 0,
  extra text check (extra in ('wd','nb','lb','b')),
  wicket_kind text, wicket_player_id text,
  commentary text,
  created_at timestamptz not null default now(),
  primary key (match_id, innings, seq),
  foreign key (match_id, innings) references innings(match_id, number) on delete cascade
);

create table if not exists batting_lines (
  match_id text, innings int, player_id text references players(id),
  runs int, balls int, fours int, sixes int, out_desc text, position int,
  primary key (match_id, innings, player_id),
  foreign key (match_id, innings) references innings(match_id, number) on delete cascade
);
create table if not exists bowling_lines (
  match_id text, innings int, player_id text references players(id),
  balls int, maidens int, runs int, wickets int,
  primary key (match_id, innings, player_id),
  foreign key (match_id, innings) references innings(match_id, number) on delete cascade
);

create table if not exists rankings (
  gender text check (gender in ('men','women')),
  kind   text check (kind in ('team','batter','bowler','allrounder')),
  format text check (format in ('TEST','ODI','T20')),
  rank int, previous_rank int, team_id text references teams(id), player_id text references players(id),
  rating int not null, as_of date not null default current_date,
  primary key (gender, kind, format, rank, as_of)
);

create table if not exists stat_leaders (
  series_id text references series(id), category text, rank int,
  player_id text references players(id), matches int, value numeric not null,
  primary key (series_id, category, rank)
);

create table if not exists articles (
  id text primary key, slug text unique not null,
  category text not null check (category in ('news','records','analysis','prediction','reactions','listicles','stories')),
  title text not null, excerpt text, body jsonb not null, author text,
  series_id text references series(id), team_ids text[],
  published_at timestamptz not null default now()
);
create index if not exists articles_published on articles (published_at desc);

create table if not exists contact_messages (
  id bigserial primary key, name text, email text, message text,
  created_at timestamptz not null default now()
);
