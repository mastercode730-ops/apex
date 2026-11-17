import Link from 'next/link';
import { getSeriesList } from '@/lib/data';
import { Breadcrumbs, PageTitle, TeamBadge } from '@/components/ui';
import { Reveal } from '@/components/client';
import { pageMeta, fmtDate } from '@/lib/site';

export const metadata = pageMeta({ title: 'Cricket Series & Tournaments', description: 'Browse all cricket series, tours and tournaments with fixtures, squads, stats and news.', path: '/series' });

export default async function SeriesList() {
  const series = await getSeriesList();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Series', href: '/series' }]} />
      <PageTitle sub="Tours, leagues and domestic competitions.">Cricket Series</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.05}>
            <Link href={`/series/${s.id}`} className="card card-hover block p-6">
              <div className="mb-4 flex -space-x-2">{s.teamIds.slice(0, 4).map((t) => <TeamBadge key={t} id={t} size={40} />)}</div>
              <h2 className="font-display text-xl font-bold">{s.name}</h2>
              <p className="mt-1 text-sm text-muted">{fmtDate(s.start)} – {fmtDate(s.end)}</p>
              <p className="mt-3 flex flex-wrap gap-2 text-xs font-bold">{s.format.map((f) => <span key={f} className="rounded-full bg-surface2 px-2.5 py-1">{f}</span>)}<span className="rounded-full bg-accentsoft px-2.5 py-1 text-accent">{s.kind}</span></p>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  );
}
