import { notFound } from 'next/navigation';
import Link from 'next/link';
import { stats, statCategories, series, playerById, teamById } from '@apex/core';
import { Breadcrumbs, PageTitle, TeamBadge } from '@/components/ui';
import { pageMeta } from '@/lib/site';

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ series?: string }> };
export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const c = statCategories.find((x) => x.id === category);
  if (!c) return { title: 'Stats not found' };
  return pageMeta({ title: `${c.label} in Cricket: Stats Corner`, description: `${c.label} leaderboard across current series. Player rankings with matches played and totals.`, path: `/stats/${c.id}` });
}

export default async function StatsPage({ params, searchParams }: Props) {
  const { category } = await params; const { series: sid = series[0].id } = await searchParams;
  const c = statCategories.find((x) => x.id === category); if (!c) notFound();
  const rows = stats(c.id, sid);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Stats Corner', href: '/stats/most-runs' }, { name: c.label, href: `/stats/${c.id}` }]} />
      <PageTitle sub="Demo statistics generated for illustration.">{c.label}</PageTitle>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Stat categories">{statCategories.map((x) => <Link key={x.id} href={`/stats/${x.id}?series=${sid}`} className="chip" aria-current={x.id === c.id ? 'true' : undefined}>{x.label}</Link>)}</div>
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Series">{series.map((s) => <Link key={s.id} href={`/stats/${c.id}?series=${s.id}`} className="chip" aria-current={s.id === sid ? 'true' : undefined}>{s.short}</Link>)}</div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm"><caption className="sr-only">{c.label}</caption>
          <thead className="bg-surface2 text-left text-xs uppercase text-muted"><tr><th scope="col" className="px-5 py-3">#</th><th scope="col">Player</th><th scope="col">Team</th><th scope="col">Mat</th><th scope="col" className="pr-5 text-right">{c.label.replace('Most ', '').replace('Highest ', '')}</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.playerId} className="border-t border-line transition hover:bg-surface2"><td className="num px-5 py-3 font-bold text-accent">{r.rank}</td>
              <td><Link href={`/player/${r.playerId}`} className="font-semibold hover:underline">{playerById(r.playerId)!.name}</Link></td>
              <td><span className="flex items-center gap-2"><TeamBadge id={r.teamId} size={22} />{teamById(r.teamId)!.code}</span></td>
              <td className="num">{r.matches}</td><td className="num pr-5 text-right font-display text-lg font-bold">{r.value}</td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
