import Link from 'next/link';
import { teams, seriesById } from '@apex/core';
import { getAllMatches } from '@/lib/data';
import { MatchCard } from '@/components/MatchCard';
import { Breadcrumbs, PageTitle } from '@/components/ui';
import { pageMeta, fmtDay } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata = pageMeta({ title: 'Cricket Schedule & Fixtures', description: 'Complete cricket fixtures and schedule: upcoming matches, live games and results, filterable by team and format.', path: '/schedule' });

export default async function Schedule({ searchParams }: { searchParams: Promise<{ team?: string; format?: string; type?: string }> }) {
  const { team = '', format = '', type = '' } = await searchParams;
  const list = (await getAllMatches())
    .filter((m) => (!team || m.team1Id === team || m.team2Id === team) && (!format || m.format === format) && (!type || seriesById(m.seriesId)?.kind === type))
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const byDay = new Map<string, typeof list>();
  list.forEach((m) => { const k = fmtDay(m.startTime); byDay.set(k, [...(byDay.get(k) ?? []), m]); });
  return (
    <>
      <Breadcrumbs items={[{ name: 'Fixtures', href: '/schedule' }]} />
      <PageTitle sub="Every match, grouped by day.">Cricket Schedule & Fixtures</PageTitle>
      <form className="card mb-8 flex flex-wrap items-end gap-4 p-4" aria-label="Filter fixtures">
        <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted">Team
          <select name="team" defaultValue={team} className="rounded-xl border border-line bg-surface2 px-3 py-2 text-sm normal-case text-ink"><option value="">All teams</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted">Format
          <select name="format" defaultValue={format} className="rounded-xl border border-line bg-surface2 px-3 py-2 text-sm normal-case text-ink"><option value="">All formats</option>{['TEST', 'ODI', 'T20', 'T10'].map((f) => <option key={f}>{f}</option>)}</select></label>
        <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted">Series type
          <select name="type" defaultValue={type} className="rounded-xl border border-line bg-surface2 px-3 py-2 text-sm normal-case text-ink"><option value="">All series</option>{['International', 'League', 'Domestic'].map((f) => <option key={f}>{f}</option>)}</select></label>
        <button className="rounded-xl bg-accent px-5 py-2 text-sm font-bold text-accentink">Apply</button>
        {(team || format || type) && <Link href="/schedule" className="text-sm text-accent underline">Clear</Link>}
      </form>
      {[...byDay.entries()].map(([day, ms]) => (
        <section key={day} className="mb-8" aria-label={day}>
          <h2 className="mb-3 font-display text-lg font-bold text-muted">{day}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ms.map((m) => <MatchCard key={m.id} m={m} />)}</div>
        </section>
      ))}
      {!list.length && <p className="card p-8 text-center text-muted">No fixtures match these filters.</p>}
    </>
  );
}
