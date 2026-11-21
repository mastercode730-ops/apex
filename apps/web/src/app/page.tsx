import Link from 'next/link';
import { teams, categoryLabels } from '@apex/core';
import { getAllMatches, getSeriesList, getHomeRankings, getArticles } from '@/lib/data';
import { MatchCard } from '@/components/MatchCard';
import { Reveal, LiveRefresh } from '@/components/client';
import { SectionHeader, TeamBadge } from '@/components/ui';
import { AdSlot } from '@/components/ads';
import { pageMeta, fmtDate, timeAgo } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata = pageMeta({ title: 'Apex | Live Cricket Scores, Fixtures, Rankings & Stats', description: 'Follow live cricket scores ball by ball, full scorecards, fixtures, series, team and player stats, and rankings on Apex.', path: '/' });

export default async function Home() {
  const matches = await getAllMatches();
  const series = await getSeriesList();
  const live = matches.filter((m) => m.status === 'live');
  const byStart = (a: { startTime: string }, b: { startTime: string }) => +new Date(a.startTime) - +new Date(b.startTime);
  const upcoming = matches.filter((m) => m.status === 'upcoming').sort(byStart);
  const done = matches.filter((m) => m.status === 'completed').sort((a, b) => byStart(b, a));
  const home = await getHomeRankings();
  const top = home.rows.slice(0, 5);
  const news = await getArticles({ limit: 3 });
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-14">
      <LiveRefresh every={6000} />
      <section aria-labelledby="hero" className="hero relative overflow-hidden rounded-[1.75rem] border border-line p-6 sm:p-14 lg:p-16">
        <div aria-hidden="true" className="absolute -right-24 -top-24 size-96 rounded-full bg-accent/20 blur-3xl" />
        <p className="float-in text-sm font-bold uppercase tracking-[0.18em] text-accent sm:tracking-[0.25em]">Every ball. Every record.</p>
        <h1 id="hero" className="float-in mt-3 max-w-3xl font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight min-[400px]:text-4xl sm:text-6xl" style={{ animationDelay: '.08s' }}>
          Live cricket, <span className="text-gradient">at the speed of the game.</span>
        </h1>
        <p className="float-in mt-5 max-w-xl text-lg text-muted" style={{ animationDelay: '.16s' }}>Ball-by-ball scores, scorecards, win probability, fixtures, rankings and stats, in one fast, beautiful place.</p>
        <div className="float-in mt-7 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap [&>a]:text-center" style={{ animationDelay: '.24s' }}>
          <Link href="/cricket-live-score" className="btn btn-primary">Watch live scores</Link>
          <Link href="/schedule" className="btn btn-ghost">Fixtures</Link>
        </div>
      </section>

      <section aria-labelledby="live-h">
        <SectionHeader id="live-h" title={`Live now (${live.length})`} href="/cricket-live-score" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{live.map((m, i) => <Reveal key={m.id} delay={i * 0.07}><MatchCard m={m} /></Reveal>)}</div>
      </section>

      <div className="grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="up-h">
          <SectionHeader id="up-h" title="Upcoming" href="/schedule" />
          <div className="grid gap-4 sm:grid-cols-2">{upcoming.slice(0, 4).map((m, i) => <Reveal key={m.id} delay={i * 0.06}><MatchCard m={m} /></Reveal>)}</div>
          <AdSlot kind="infeed" className="mt-10" />
          <div className="mt-10"><SectionHeader title="Recent results" href="/cricket-live-score" /></div>
          <div className="grid gap-4 sm:grid-cols-2">{done.slice(0, 4).map((m, i) => <Reveal key={m.id} delay={i * 0.06}><MatchCard m={m} /></Reveal>)}</div>
        </section>
        <aside aria-label="Rankings and teams" className="grid content-start gap-10">
          <Reveal>
            <SectionHeader title={home.title} href={home.href} />
            <ol className="card divide-y divide-line">
              {top.map((r) => (
                <li key={r.rank} className="flex items-center gap-3 px-4 py-3">
                  <span className="num w-5 font-display font-bold text-accent">{r.rank}</span>
                  <TeamBadge id={r.teamId} size={28} />
                  <Link href={r.playerId ? `/player/${r.playerId}` : `/team/${r.teamId}`} className="flex-1 font-semibold hover:underline">{r.name}</Link>
                  <span className="num font-bold">{r.rating}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <AdSlot kind="rect" />
          <Reveal>
            <SectionHeader title="Teams" href="/team" />
            <div className="flex flex-wrap gap-2">{teams.map((t) => <Link key={t.id} href={`/team/${t.id}`} className="chip"><TeamBadge id={t.id} size={20} />{t.name}</Link>)}</div>
          </Reveal>
        </aside>
      </div>

      <AdSlot kind="banner" />

      <section aria-labelledby="series-h">
        <SectionHeader id="series-h" title="Featured series" href="/series" />
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
          {series.map((s) => (
            <Link key={s.id} href={`/series/${s.id}`} className="card card-hover w-60 shrink-0 p-5 sm:w-64">
              <div className="mb-3 flex -space-x-2">{s.teamIds.slice(0, 3).map((t) => <TeamBadge key={t} id={t} size={32} />)}</div>
              <h3 className="font-display font-bold">{s.short}</h3>
              <p className="mt-1 text-sm text-muted">{fmtDate(s.start)} – {fmtDate(s.end)}</p>
            </Link>
          ))}
        </div>
      </section>

      {news.length > 0 && <section aria-labelledby="news-h">
        <SectionHeader id="news-h" title="Top headlines" href="/news" linkLabel="All news" />
        <div className="grid gap-4 md:grid-cols-3">
          {news.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.08}>
              <Link href={`/news/${a.slug}`} className="card card-hover block h-full p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">{categoryLabels[a.category]}</p>
                <h3 className="mt-2 font-display text-lg font-bold leading-snug">{a.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{a.excerpt}</p>
                <p className="mt-4 text-xs text-muted">{a.author} · {timeAgo(a.publishedAt)}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>}
    </div>
  );
}
