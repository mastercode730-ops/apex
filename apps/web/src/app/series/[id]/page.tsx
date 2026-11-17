import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMatchesBySeries, getAllMatches, getStatLeaders, getArticles } from '@/lib/data';
import { seriesById, teamById, statCategories, playerById, squadOf, pointsTable, type Article } from '@apex/core';
import { MatchCard } from '@/components/MatchCard';
import { Breadcrumbs, PageTitle, TabLinks, TeamBadge, SectionHeader, PlayerAvatar } from '@/components/ui';
import { pageMeta, fmtDate, timeAgo } from '@/lib/site';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };
export async function generateMetadata({ params }: Props) {
  await getAllMatches();
  const s = seriesById((await params).id);
  if (!s) return { title: 'Series not found' };
  return pageMeta({ title: `${s.name}: Schedule, Squads, Stats & News`, description: `${s.name} (${fmtDate(s.start)} to ${fmtDate(s.end)}). Fixtures, results, squads, top performers and news.`, path: `/series/${s.id}` , ownImage: true });
}
const TABS = [['overview', 'Overview'], ['matches', 'Matches'], ['points', 'Points table'], ['squads', 'Squads'], ['stats', 'Series stats'], ['news', 'News']] as const;

export default async function SeriesPage({ params, searchParams }: Props) {
  const { id } = await params; const { tab = 'overview' } = await searchParams;
  await getAllMatches();
  const s = seriesById(id); if (!s) notFound();
  const ms = await getMatchesBySeries(s.id);
  const news = await getArticles({ seriesId: s.id });
  const leaders = tab === 'stats' ? await Promise.all(statCategories.slice(0, 4).map(async (c) => ({ c, rows: await getStatLeaders(c.id, s.id) }))) : [];
  const base = `/series/${s.id}`;
  return (
    <>
      <Breadcrumbs items={[{ name: 'Series', href: '/series' }, { name: s.short, href: base }]} />
      <PageTitle sub={`${fmtDate(s.start)} – ${fmtDate(s.end)} · ${s.format.join(', ')}`}>{s.name}</PageTitle>
      <TabLinks current={tab} tabs={TABS.map(([k, l]) => ({ key: k, label: l, href: k === 'overview' ? base : `${base}?tab=${k}` }))} />
      {tab === 'overview' && (
        <div className="grid gap-10">
          <section><SectionHeader title="Featured matches" href={`${base}?tab=matches`} linkLabel="All matches" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ms.slice(0, 3).map((m) => <MatchCard key={m.id} m={m} />)}</div>{!ms.length && <p className="text-muted">Fixtures to be announced.</p>}</section>
          <section><SectionHeader title="Teams" /><div className="flex flex-wrap gap-3">{s.teamIds.map((t) => <Link key={t} href={`/team/${t}`} className="chip"><TeamBadge id={t} size={22} />{teamById(t)!.name}</Link>)}</div></section>
          <section><SectionHeader title="Top headlines" href={`${base}?tab=news`} linkLabel="All news" /><NewsList items={news.slice(0, 3)} /></section>
        </div>
      )}
      {tab === 'matches' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ms.map((m) => <MatchCard key={m.id} m={m} />)}</div>}
      {tab === 'points' && (() => { const rows = pointsTable(s.teamIds, ms.filter((m) => m.status === 'completed')); return (
        <div className="card overflow-x-auto"><table className="w-full min-w-[28rem] text-sm"><caption className="sr-only">Points table</caption>
          <thead className="bg-surface2 text-left text-xs uppercase text-muted"><tr><th scope="col" className="px-5 py-3">Team</th><th scope="col">P</th><th scope="col">W</th><th scope="col">L</th><th scope="col">NR</th><th scope="col">NRR</th><th scope="col" className="pr-5 text-right">Pts</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.teamId} className="border-t border-line"><td className="px-5 py-3"><Link href={`/team/${r.teamId}`} className="flex items-center gap-3 font-semibold hover:underline"><TeamBadge id={r.teamId} size={26} />{teamById(r.teamId)!.name}</Link></td><td className="num">{r.played}</td><td className="num">{r.won}</td><td className="num">{r.lost}</td><td className="num">{r.noResult}</td><td className="num">{r.nrr > 0 ? '+' : ''}{r.nrr}</td><td className="num pr-5 text-right font-bold text-accent">{r.points}</td></tr>)}</tbody></table></div>); })()}
      {tab === 'squads' && <div className="grid gap-6 md:grid-cols-2">{s.teamIds.map((t) => <section key={t} className="card p-5"><h2 className="mb-3 flex items-center gap-3 font-display text-lg font-bold"><TeamBadge id={t} size={32} />{teamById(t)!.name}</h2><ul className="divide-y divide-line">{squadOf(t).map((p) => <li key={p.id} className="flex items-center gap-3 py-2"><PlayerAvatar id={p.id} size={30} /><Link href={`/player/${p.id}`} className="flex-1 font-semibold hover:underline">{p.name}</Link><span className="text-xs text-muted">{p.role}</span></li>)}</ul></section>)}</div>}
      {tab === 'stats' && <div className="grid gap-6 md:grid-cols-2">{leaders.map(({ c, rows }) => <section key={c.id} className="card p-5"><h2 className="mb-3 font-display text-lg font-bold">{c.label}</h2>{!rows.length && <p className="text-sm text-muted">No data yet.</p>}<ol className="divide-y divide-line">{rows.slice(0, 5).map((r) => <li key={r.playerId} className="flex items-center gap-3 py-2"><span className="num w-5 text-accent font-bold">{r.rank}</span><span className="flex-1 font-semibold">{playerById(r.playerId)?.name ?? r.playerId}</span><span className="num font-bold">{r.value}</span></li>)}</ol><Link href={`/stats/${c.id}?series=${s.id}`} className="mt-3 inline-block text-sm font-semibold text-accent">Full list →</Link></section>)}</div>}
      {tab === 'news' && (news.length ? <NewsList items={news} /> : <p className="text-muted">No news for this series yet.</p>)}
    </>
  );
}

function NewsList({ items }: { items: Article[] }) {
  return <div className="grid gap-4 md:grid-cols-3">{items.map((a) => <Link key={a.id} href={`/news/${a.slug}`} className="card card-hover block p-5"><h3 className="font-display font-bold leading-snug">{a.title}</h3><p className="mt-3 text-xs text-muted">{a.author} · {timeAgo(a.publishedAt)}</p></Link>)}</div>;
}
