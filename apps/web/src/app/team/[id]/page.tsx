import { notFound } from 'next/navigation';
import Link from 'next/link';
import { teamById, squadOf } from '@apex/core';
import { getMatchesByTeam, getAllMatches, getRankings, getArticles } from '@/lib/data';
import { MatchCard } from '@/components/MatchCard';
import { Breadcrumbs, JsonLd, PageTitle, PlayerAvatar, SectionHeader, TabLinks, TeamBadge } from '@/components/ui';
import { pageMeta, timeAgo, SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };
export async function generateMetadata({ params }: Props) {
  await getAllMatches();
  const t = teamById((await params).id);
  if (!t) return { title: 'Team not found' };
  return pageMeta({ title: `${t.name} Cricket Team: Squad, Matches, Rankings & News`, description: `${t.name} cricket team profile: squad, upcoming fixtures, recent results, rankings and latest news. ${t.bio}`, path: `/team/${t.id}` , ownImage: true });
}
const TABS = [['overview', 'Overview'], ['squad', 'Squad'], ['matches', 'Matches'], ['news', 'News']] as const;

export default async function TeamPage({ params, searchParams }: Props) {
  const { id } = await params; const { tab = 'overview' } = await searchParams;
  await getAllMatches();
  const t = teamById(id); if (!t) notFound();
  const ms = await getMatchesByTeam(t.id), squad = squadOf(t.id), news = await getArticles({ teamId: t.id });
  const rank = (await Promise.all((['TEST', 'ODI', 'T20'] as const).map(async (f) => ({ f, r: (await getRankings('team', f, 'men')).find((x) => x.teamId === t.id) })))).filter((x) => x.r) as { f: string; r: { rank: number; rating: number } }[];
  const base = `/team/${t.id}`;
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'SportsTeam', name: t.name, sport: 'Cricket', url: `${SITE.url}${base}` }} />
      <Breadcrumbs items={[{ name: 'Teams', href: '/team' }, { name: t.name, href: base }]} />
      <div className="mb-6 flex items-center gap-5"><TeamBadge id={t.id} size={72} /><PageTitle>{t.name}</PageTitle></div>
      <TabLinks current={tab} tabs={TABS.map(([k, l]) => ({ key: k, label: l, href: k === 'overview' ? base : `${base}?tab=${k}` }))} />
      {tab === 'overview' && (
        <div className="grid gap-10">
          <section><SectionHeader title="Featured matches" href={`${base}?tab=matches`} linkLabel="All matches" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ms.slice(0, 3).map((m) => <MatchCard key={m.id} m={m} />)}</div></section>
          <section className="grid gap-6 md:grid-cols-2">
            <div className="card p-6"><h2 className="font-display text-lg font-bold">About</h2><dl className="mt-3 grid gap-2 text-sm"><div><dt className="inline text-muted">Since: </dt><dd className="inline font-semibold">{t.since}</dd></div><div><dt className="inline text-muted">Board: </dt><dd className="inline font-semibold">{t.board}</dd></div></dl><p className="mt-3 text-muted">{t.bio}</p></div>
            <div className="card p-6"><h2 className="font-display text-lg font-bold">ICC team rankings</h2><ul className="mt-3 grid grid-cols-3 gap-3 text-center">{rank.map(({ f, r }) => <li key={f} className="rounded-xl bg-surface2 p-3"><p className="text-xs font-bold text-muted">{f}</p><p className="num font-display text-3xl font-extrabold text-accent">#{r.rank}</p><p className="num text-xs text-muted">{r.rating} pts</p></li>)}</ul></div>
          </section>
        </div>
      )}
      {tab === 'squad' && <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{squad.map((p) => <li key={p.id}><Link href={`/player/${p.id}`} className="card card-hover flex items-center gap-4 p-4"><PlayerAvatar id={p.id} size={48} /><span><b className="block">{p.name}</b><span className="text-sm text-muted">{p.role}</span></span></Link></li>)}</ul>}
      {tab === 'matches' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ms.map((m) => <MatchCard key={m.id} m={m} />)}</div>}
      {tab === 'news' && (news.length ? <div className="grid gap-4 md:grid-cols-3">{news.map((a) => <Link key={a.id} href={`/news/${a.slug}`} className="card card-hover block p-5"><h3 className="font-display font-bold leading-snug">{a.title}</h3><p className="mt-3 text-xs text-muted">{a.author} · {timeAgo(a.publishedAt)}</p></Link>)}</div> : <p className="text-muted">No news yet.</p>)}
    </>
  );
}
