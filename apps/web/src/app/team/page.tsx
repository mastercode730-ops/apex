import Link from 'next/link';
import { teams } from '@apex/core';
import { getAllMatches } from '@/lib/data';
import { Breadcrumbs, PageTitle, TeamBadge } from '@/components/ui';
import { Reveal } from '@/components/client';
import { pageMeta } from '@/lib/site';

export const metadata = pageMeta({ title: 'Cricket Teams', description: 'All international cricket teams with squads, fixtures, results and news.', path: '/team' });

export default async function Teams() {
  await getAllMatches();
  return (
    <>
      <Breadcrumbs items={[{ name: 'Teams', href: '/team' }]} />
      <PageTitle sub="International sides, squads and fixtures.">Cricket Teams</PageTitle>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {teams.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.04}>
            <Link href={`/team/${t.id}`} className="card card-hover grid place-items-center gap-3 p-6 text-center">
              <TeamBadge id={t.id} size={64} /><h2 className="font-display font-bold">{t.name}</h2>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  );
}
