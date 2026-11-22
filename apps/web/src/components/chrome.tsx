import Link from 'next/link';
import { teamById, teams, players } from '@apex/core';
import { getAllMatches, getSeriesList } from '@/lib/data';
import { NAV, SITE } from '@/lib/site';
import { ThemeToggle } from './client';
import { TabBar } from './tabbar';
import { NavLinks } from './smooth';

export function Header() {
  return (
    <header className="site-header sticky top-0 z-40">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accentink">Skip to content</a>
      <div className="header-inner relative mx-auto flex max-w-7xl 2xl:max-w-[90rem] items-center gap-3 px-4 sm:gap-4">
        <Link href="/" className="group flex items-center gap-2 font-display text-xl font-extrabold tracking-tight" aria-label="Apex home">
          <span aria-hidden="true" className="logo-mark grid size-8 place-items-center rounded-lg bg-accent text-accentink transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-6deg]">▲</span> APEX
        </Link>
        <NavLinks items={NAV} />
        <div className="ml-auto flex items-center gap-2">
          <form action="/search" role="search" className="hidden lg:block">
            <input name="q" type="search" placeholder="Search teams, players, series" aria-label="Search" className="w-32 rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none transition focus:border-accent xl:w-56 xl:focus:w-72" />
          </form>
          <Link href="/search" aria-label="Search" className="search-pill lg:hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="size-[1.1rem]"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            Search
          </Link>
          <div className="hidden lg:block"><ThemeToggle /></div>
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar for phones/tablets. The second tab follows the featured series (live one first), like a "current tournament" shortcut. */
export async function MobileTabBar() {
  const [matches, series] = await Promise.all([getAllMatches(), getSeriesList()]);
  const live = matches.filter((m) => m.status === 'live');
  const hot = series.find((s) => live.some((m) => m.seriesId === s.id)) ?? series[0];
  return <TabBar featured={hot ? { href: `/series/${hot.id}`, label: hot.short.length > 9 ? hot.short.slice(0, 9) : hot.short } : { href: '/series', label: 'Series' }} liveCount={live.length} />;
}

export async function Ticker() {
  const live = (await getAllMatches()).filter((m) => m.status === 'live');
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

export async function Footer() {
  const [series] = await Promise.all([getSeriesList()]);
  const cols: { h: string; l: [string, string][] }[] = [
    { h: 'Explore', l: [['Live scores', '/cricket-live-score'], ['Fixtures', '/schedule'], ['Series', '/series'], ['Stats Corner', '/stats'], ['Rankings', '/rankings/men/team'], ['News', '/news']] },
    { h: 'Tournaments', l: series.slice(0, 6).map((s) => [s.name, `/series/${s.id}`] as [string, string]) },
    { h: 'Teams', l: teams.slice(0, 7).map((t) => [t.name, `/team/${t.id}`] as [string, string]) },
    { h: 'Players', l: players.slice(0, 6).map((p) => [p.name, `/player/${p.id}`] as [string, string]) },
    { h: 'Company', l: [['Contact', '/contact'], ['Privacy Policy', '/privacy-policy'], ['Terms & Conditions', '/terms-and-conditions'], ['Community Guidelines', '/community-guidelines'], ['Editorial Policy', '/editorial-policy'], ['Sitemap', '/sitemap.xml']] },
  ];
  return (
    <footer className="mt-16 border-t border-line bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-10 2xl:max-w-[90rem]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-5">
          {cols.map((c) => (
            <nav key={c.h} aria-label={c.h}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-muted">{c.h}</h2>
              <ul className="grid gap-2 text-sm">{c.l.map(([n, h]) => <li key={h}><Link href={h} className="transition-colors hover:text-accent">{n}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl font-extrabold">APEX</p>
            <p className="mt-1 max-w-md text-xs text-muted">{SITE.tagline}.</p>
          </div>
          {(process.env.NEXT_PUBLIC_APP_STORE_URL || process.env.NEXT_PUBLIC_PLAY_STORE_URL) && (
            <div className="flex flex-wrap gap-2">
              {process.env.NEXT_PUBLIC_APP_STORE_URL && <a href={process.env.NEXT_PUBLIC_APP_STORE_URL} className="chip" rel="noopener">Download on the App Store</a>}
              {process.env.NEXT_PUBLIC_PLAY_STORE_URL && <a href={process.env.NEXT_PUBLIC_PLAY_STORE_URL} className="chip" rel="noopener">Get it on Google Play</a>}
            </div>
          )}
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">© {new Date().getFullYear()} Apex. All rights reserved.</p>
    </footer>
  );
}
