import Link from 'next/link';
import { teams, teamById, categoryLabels, type Article } from '@apex/core';
import { getAllMatches, getSeriesList, getHomeRankings, getArticles } from '@/lib/data';
import { StripCard } from '@/components/StripCard';
import { ContentTabs, HScroll } from '@/components/tabs';
import { LiveRefresh, Reveal } from '@/components/client';
import { AdSlot } from '@/components/ads';
import { SectionHeader, TeamBadge } from '@/components/ui';
import { pageMeta, fmtDate, timeAgo } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata = pageMeta({ title: 'Apex | Live Cricket Scores, Fixtures, Rankings & Stats', description: 'Follow live cricket scores ball by ball, full scorecards, fixtures, series, team and player stats, and rankings on Apex.', path: '/' });

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
/** A cover colour for stories (no photos yet): the first tagged team's colours, else a stable hue from the title. */
function cover(a: Article) {
  const t = a.teamIds?.map((id) => teamById(id)).find(Boolean);
  const h = hash(a.title) % 360;
  return { background: t ? `linear-gradient(135deg, ${t.color}, color-mix(in srgb, ${t.color} 40%, #0b1020))` : `linear-gradient(135deg, hsl(${h} 55% 38%), hsl(${(h + 50) % 360} 60% 22%))` };
}

function NewsBlock({ list }: { list: Article[] }) {
  const [lead, ...rest] = list;
  if (!lead) return <p className="card p-8 text-center text-muted">No stories yet.</p>;
  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
      <Link href={`/news/${lead.slug}`} className="news-cover card-hover group min-h-[15rem] p-5 sm:min-h-[22rem] sm:p-8" style={cover(lead)}>
        <div className="max-w-xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/80">{categoryLabels[lead.category]}</p>
          <h3 className="font-display text-xl font-extrabold leading-snug sm:text-3xl">{lead.title}</h3>
          <p className="mt-3 hidden line-clamp-2 text-white/80 sm:block">{lead.excerpt}</p>
          <p className="mt-3 text-xs text-white/70">{lead.author} · {timeAgo(lead.publishedAt)}</p>
        </div>
      </Link>
      <ul className="grid content-start divide-y divide-line">
        {rest.slice(0, 4).map((a) => (
          <li key={a.id}>
            <Link href={`/news/${a.slug}`} className="group flex items-center gap-4 py-3 first:pt-0 lg:py-4">
              <span aria-hidden="true" className="size-[4.5rem] shrink-0 rounded-xl sm:size-24" style={cover(a)} />
              <span className="min-w-0">
                <span className="block font-semibold leading-snug transition-colors group-hover:text-accent">{a.title}</span>
                <span className="mt-1 block text-xs uppercase tracking-wide text-muted">{a.author} · {timeAgo(a.publishedAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Home() {
  const matches = await getAllMatches();
  const series = await getSeriesList();
  const byStart = (a: { startTime: string }, b: { startTime: string }) => +new Date(a.startTime) - +new Date(b.startTime);
  const live = matches.filter((m) => m.status === 'live');
  const upcoming = matches.filter((m) => m.status === 'upcoming').sort(byStart);
  const done = matches.filter((m) => m.status === 'completed').sort((a, b) => byStart(b, a));
  const top = [...live, ...upcoming.slice(0, 6), ...done.slice(0, 4)].slice(0, 12);
  const home = await getHomeRankings();
  const articles = await getArticles({ limit: 40 });
  const cats = (['analysis', 'records', 'prediction', 'reactions'] as const).filter((c) => articles.some((a) => a.category === c));

  const strip = (list: typeof matches, empty: string) => list.length
    ? <HScroll>{list.map((m) => <StripCard key={m.id} m={m} />)}</HScroll>
    : <p className="card p-8 text-center text-muted">{empty}</p>;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 sm:gap-12">
      <LiveRefresh every={6000} />
      <h1 className="sr-only">Apex: live cricket scores, fixtures, rankings and stats</h1>

      {/* quick shortcuts (phones) */}
      <nav aria-label="Shortcuts" className="no-scrollbar -mx-4 -mb-4 flex gap-2.5 overflow-x-auto px-4 md:hidden">
        {[...teams.slice(0, 1).map((t) => ({ href: `/team/${t.id}`, label: t.name, badge: t.id })), ...series.slice(0, 3).map((s) => ({ href: `/series/${s.id}`, label: s.short, badge: s.teamIds[0] }))].map((q) => (
          <Link key={q.href} href={q.href} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold shadow-sm"><TeamBadge id={q.badge} size={24} />{q.label} <span aria-hidden="true" className="text-muted">›</span></Link>
        ))}
      </nav>

      {/* top matches */}
      <section aria-label="Matches">
        <ContentTabs
          label="Match filters"
          aside={<Link href="/schedule" className="text-accent">Cricket Schedule ›</Link>}
          tabs={[
            { key: 'top', label: 'Top Matches', content: strip(top, 'No matches right now. Check the schedule.') },
            { key: 'live', label: 'Live', badge: live.length, live: live.length > 0, content: strip(live, 'No live matches at the moment.') },
            { key: 'up', label: 'Upcoming', content: strip(upcoming.slice(0, 10), 'No upcoming matches scheduled.') },
            { key: 'res', label: 'Results', content: strip(done.slice(0, 10), 'No completed matches yet.') },
          ]}
        />
      </section>

      <AdSlot kind="banner" />

      {/* featured news */}
      {articles.length > 0 && (
        <section aria-labelledby="news-h">
          <SectionHeader id="news-h" title="Featured News" href="/news" linkLabel="All News" />
          <ContentTabs
            label="News categories" variant="chips"
            tabs={[
              { key: 'top', label: 'Top Headlines', content: <NewsBlock list={articles.slice(0, 5)} /> },
              { key: 'latest', label: 'Latest', content: <NewsBlock list={[...articles].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)).slice(0, 5)} /> },
              ...cats.map((c) => ({ key: c, label: categoryLabels[c], content: <NewsBlock list={articles.filter((a) => a.category === c).slice(0, 5)} /> })),
            ]}
          />
        </section>
      )}

      {/* featured series */}
      <section aria-labelledby="series-h">
        <SectionHeader id="series-h" title="Featured Series" href="/series" />
        <HScroll>
          {series.map((s) => {
            const [a, b] = [teamById(s.teamIds[0]), teamById(s.teamIds[1] ?? s.teamIds[0])];
            return (
              <Link key={s.id} href={`/series/${s.id}`} className="group block w-[14.5rem] sm:w-64">
                <div className="series-cover card-hover" style={{ background: `linear-gradient(120deg, ${a?.color ?? '#1f3a8a'} 0%, color-mix(in srgb, ${a?.color ?? '#1f3a8a'} 35%, ${b?.color ?? '#0b1020'}) 50%, ${b?.color ?? '#0b1020'} 100%)` }}>
                  <div className="p-4">
                    <div className="mb-2 flex justify-center -space-x-2">{s.teamIds.slice(0, 3).map((t) => <TeamBadge key={t} id={t} size={34} />)}</div>
                    <p className="font-display text-lg font-extrabold uppercase leading-tight tracking-wide drop-shadow">{s.short}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[.18em] text-white/80">{s.format.join(' · ')}</p>
                  </div>
                </div>
                <p className="mt-2 font-semibold transition-colors group-hover:text-accent">{s.name}</p>
                <p className="text-xs text-muted">{fmtDate(s.start)} – {fmtDate(s.end)}</p>
              </Link>
            );
          })}
        </HScroll>
      </section>

      {/* rankings + teams */}
      <div className="grid gap-10 lg:grid-cols-2">
        <Reveal>
          <SectionHeader title={home.title} href={home.href} />
          <ol className="card divide-y divide-line">
            {home.rows.slice(0, 5).map((r) => (
              <li key={r.rank} className="flex items-center gap-3 px-4 py-3">
                <span className="num w-5 font-display font-bold text-accent">{r.rank}</span>
                <TeamBadge id={r.teamId} size={28} />
                <Link href={r.playerId ? `/player/${r.playerId}` : `/team/${r.teamId}`} className="flex-1 font-semibold hover:underline">{r.name}</Link>
                <span className="num font-bold">{r.rating}</span>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal delay={0.06}>
          <SectionHeader title="Teams" href="/team" />
          <div className="flex flex-wrap gap-2">{teams.map((t) => <Link key={t.id} href={`/team/${t.id}`} className="chip"><TeamBadge id={t.id} size={20} />{t.name}</Link>)}</div>
        </Reveal>
      </div>
    </div>
  );
}
