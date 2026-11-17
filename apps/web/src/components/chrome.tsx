import Link from 'next/link';
import { allMatches, teamById } from '@apex/core';
import { NAV, SITE } from '@/lib/site';
import { ThemeToggle, MobileMenu } from './client';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accentink">Skip to content</a>
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight" aria-label="Apex home">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-accent text-accentink">▲</span> APEX
        </Link>
        <nav aria-label="Primary" className="ml-4 hidden gap-1 md:flex">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition hover:bg-surface2 hover:text-ink">{n.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <form action="/search" role="search" className="hidden sm:block">
            <input name="q" type="search" placeholder="Search teams, players, series" aria-label="Search" className="w-56 rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none transition focus:w-72 focus:border-accent" />
          </form>
          <Link href="/search" aria-label="Search" className="grid size-9 place-items-center rounded-full border border-line bg-surface sm:hidden"><span aria-hidden="true">⌕</span></Link>
          <ThemeToggle />
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}

export function Ticker() {
  const live = allMatches().filter((m) => m.status === 'live');
  if (!live.length) return null;
  const items = [...live, ...live];
  return (
    <div className="overflow-hidden border-b border-line bg-surface/60" aria-label="Live scores ticker">
      <div className="marquee-track gap-8 py-2 text-sm">
        {items.map((m, i) => {
          const cur = m.innings[m.innings.length - 1];
          return (
            <Link key={i} href={`/cricket-live-score/${m.slug}`} aria-hidden={i >= live.length ? true : undefined} tabIndex={i >= live.length ? -1 : undefined} className="flex items-center gap-2 whitespace-nowrap px-4">
              <span className="live-dot" />
              <b>{teamById(m.team1Id)!.code} v {teamById(m.team2Id)!.code}</b>
              {cur && <span className="num text-muted">{teamById(cur.battingTeamId)!.code} {cur.runs}/{cur.wickets} ({cur.overs})</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Footer() {
  const cols = [
    { h: 'Explore', l: [['Live scores', '/cricket-live-score'], ['Fixtures', '/schedule'], ['Series', '/series'], ['Teams', '/team'], ['Stats', '/stats'], ['Rankings', '/rankings/men/team'], ['News', '/news']] },
    { h: 'Company', l: [['Contact', '/contact'], ['Privacy Policy', '/privacy-policy'], ['Terms & Conditions', '/terms-and-conditions'], ['Sitemap', '/sitemap.xml']] },
  ];
  return (
    <footer className="mt-20 border-t border-line bg-surface/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-extrabold">APEX</p>
          <p className="mt-3 max-w-sm text-sm text-muted">{SITE.tagline}. Demo data is simulated and for demonstration only.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.h} aria-label={c.h}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">{c.h}</h2>
            <ul className="grid gap-2 text-sm">{c.l.map(([n, h]) => <li key={h}><Link href={h} className="hover:text-accent hover:underline">{n}</Link></li>)}</ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-line py-5 text-center text-xs text-muted">© {new Date().getFullYear()} Apex. All rights reserved.</p>
    </footer>
  );
}
