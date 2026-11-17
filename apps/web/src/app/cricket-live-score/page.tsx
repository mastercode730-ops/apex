import { getAllMatches } from '@/lib/data';
import { MatchCard } from '@/components/MatchCard';
import { LiveRefresh } from '@/components/client';
import { Breadcrumbs, PageTitle, SectionHeader } from '@/components/ui';
import { pageMeta } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata = pageMeta({ title: 'Live Cricket Score, Scorecards & Match Updates', description: 'Live cricket scores with ball-by-ball updates, scorecards, win probability and results for every match on Apex.', path: '/cricket-live-score' });

export default async function LivePage() {
  const all = await getAllMatches();
  const groups = [['Live', all.filter((m) => m.status === 'live')], ['Upcoming', all.filter((m) => m.status === 'upcoming')], ['Completed', all.filter((m) => m.status === 'completed')]] as const;
  return (
    <>
      <LiveRefresh every={6000} />
      <Breadcrumbs items={[{ name: 'Live Scores', href: '/cricket-live-score' }]} />
      <PageTitle sub="Scores update automatically while you watch.">Cricket Live Score</PageTitle>
      <div className="grid gap-10">
        {groups.map(([label, ms]) => ms.length > 0 && (
          <section key={label} aria-label={label}>
            <SectionHeader title={`${label} (${ms.length})`} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ms.map((m) => <MatchCard key={m.id} m={m} />)}</div>
          </section>
        ))}
      </div>
    </>
  );
}
