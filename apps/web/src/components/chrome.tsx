import Link from 'next/link';
import { teamById } from '@apex/core';
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
            <input name="q" type="search" placeholder="Search teams, players, series" aria-label="Search" className="w-40 rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none transition focus:w-52 focus:border-accent xl:w-56 xl:focus:w-72" />
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

export function Footer() {
  const cols = [
    { h: 'Explore', l: [['Live scores', '/cricket-live-score'], ['Fixtures', '/schedule'], ['Series', '/series'], ['Teams', '/team'], ['Stats', '/stats'], ['Rankings', '/rankings/men/team'], ['News', '/news']] },
    { h: 'Company', l: [['Contact', '/contact'], ['Privacy Policy', '/privacy-policy'], ['Terms & Conditions', '/terms-and-conditions'], ['Community Guidelines', '/community-guidelines'], ['Editorial Policy', '/editorial-policy'], ['Sitemap', '/sitemap.xml']] },
  ];
  return (
    <footer className="mt-20 border-t border-line bg-surface/50">
      <div className="mx-auto grid max-w-7xl gap-10 2xl:max-w-[90rem] px-4 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-2xl font-extrabold">APEX</p>
          <p className="mt-3 max-w-sm text-sm text-muted">{SITE.tagline}.</p>
          {(process.env.NEXT_PUBLIC_APP_STORE_URL || process.env.NEXT_PUBLIC_PLAY_STORE_URL) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {process.env.NEXT_PUBLIC_APP_STORE_URL && <a href={process.env.NEXT_PUBLIC_APP_STORE_URL} className="chip" rel="noopener">Download on the App Store</a>}
              {process.env.NEXT_PUBLIC_PLAY_STORE_URL && <a href={process.env.NEXT_PUBLIC_PLAY_STORE_URL} className="chip" rel="noopener">Get it on Google Play</a>}
            </div>
          )}
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
