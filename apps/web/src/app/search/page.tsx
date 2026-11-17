import Link from 'next/link';
import { teams, players, series } from '@apex/core';
import { getAllMatches, getArticles, ensureRegistry } from '@/lib/data';
import { Breadcrumbs, PageTitle } from '@/components/ui';
import { pageMeta } from '@/lib/site';

export const metadata = pageMeta({ title: 'Search Cricket Teams, Players, Series & News', description: 'Search teams, players, series, matches and news on Apex.', path: '/search', noindex: true });

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').trim().toLowerCase();
  await ensureRegistry();
  const allM = await getAllMatches();
  const articles = await getArticles();
  const hit = (s: string) => q && s.toLowerCase().includes(q);
  const groups = [
    ['Teams', teams.filter((t) => hit(t.name) || hit(t.code)).map((t) => [t.name, `/team/${t.id}`])],
    ['Players', players.filter((p) => hit(p.name)).map((p) => [p.name, `/player/${p.id}`])],
    ['Series', series.filter((s) => hit(s.name)).map((s) => [s.name, `/series/${s.id}`])],
    ['Matches', allM.filter((m) => hit(m.title)).map((m) => [m.title, `/cricket-live-score/${m.slug}`])],
    ['News', articles.filter((a) => hit(a.title)).map((a) => [a.title, `/news/${a.slug}`])],
  ] as const;
  const total = groups.reduce((n, g) => n + g[1].length, 0);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Search', href: '/search' }]} />
      <PageTitle>Search</PageTitle>
      <form role="search" className="mb-8"><input name="q" defaultValue={q} autoFocus type="search" aria-label="Search" placeholder="Try “India”, “Bumrah”, “T10”…" className="w-full max-w-xl rounded-full border border-line bg-surface px-6 py-3 text-lg outline-none focus:border-accent" /></form>
      {q && !total && <p className="text-muted">No results for “{q}”.</p>}
      {groups.map(([label, items]) => items.length > 0 && (
        <section key={label} className="mb-8"><h2 className="mb-3 font-display text-lg font-bold">{label}</h2><ul className="grid gap-2">{items.map(([name, href]) => <li key={href}><Link href={href} className="card card-hover block px-5 py-3 font-semibold">{name}</Link></li>)}</ul></section>
      ))}
    </>
  );
}
