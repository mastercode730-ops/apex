'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeToggle } from './client';

type Featured = { href: string; label: string };
const I = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true } as const;
const icons = {
  home: <svg {...I}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h4.5v-5.5h4v5.5h4.5V10" /></svg>,
  trophy: <svg {...I}><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4M8.5 20h7M10 17h4" /></svg>,
  bat: <svg {...I}><rect x="9" y="3" width="6" height="12" rx="2.5" transform="rotate(25 12 9)" /><path d="m9.5 15.5-4.2 4.2" /><circle cx="18.5" cy="19" r="1.4" /></svg>,
  news: <svg {...I}><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 16.5h5" /></svg>,
  more: <svg {...I}><circle cx="5.5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18.5" cy="12" r="1.2" fill="currentColor" /></svg>,
  close: <svg {...I}><path d="M6 6l12 12M18 6 6 18" /></svg>,
};

const MORE = [
  { href: '/series', label: 'Series' }, { href: '/team', label: 'Teams' }, { href: '/stats', label: 'Stats' }, { href: '/rankings/men/team', label: 'Rankings' },
  { href: '/schedule', label: 'Fixtures' }, { href: '/search', label: 'Search' }, { href: '/contact', label: 'Contact' }, { href: '/sitemap.xml', label: 'Sitemap' },
];
const LEGAL = [['Privacy Policy', '/privacy-policy'], ['Terms', '/terms-and-conditions'], ['Guidelines', '/community-guidelines'], ['Editorial Policy', '/editorial-policy']];

/** Phone/tablet bottom navigation: Home · featured series · Matches · News · More. */
export function TabBar({ featured, liveCount }: { featured: Featured; liveCount: number }) {
  const path = usePathname();
  const [more, setMore] = useState(false);
  useEffect(() => { setMore(false); }, [path]);
  useEffect(() => {
    if (!more) return;
    const lenis = window.__lenis; lenis?.stop();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMore(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { lenis?.start(); document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [more]);

  const is = (h: string) => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'));
  const tabs = [
    { href: '/', label: 'Home', icon: icons.home, on: path === '/' },
    { href: featured.href, label: featured.label, icon: icons.trophy, on: is(featured.href) || (featured.href !== '/series' && path === '/series') },
    { href: '/cricket-live-score', label: 'Matches', icon: icons.bat, on: is('/cricket-live-score') || is('/schedule'), live: liveCount > 0 },
    { href: '/news', label: 'News', icon: icons.news, on: is('/news') },
  ];
  return (
    <>
      <nav aria-label="Main" className="tabbar lg:hidden">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map((t) => (
            <li key={t.href + t.label}>
              <Link href={t.href} aria-current={t.on ? 'page' : undefined} className="tab">
                <span className="tab-icon">{t.icon}{t.live && <span aria-label={`${liveCount} live`} className="live-dot tab-live" />}</span>
                <span className="tab-label">{t.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <button type="button" aria-expanded={more} aria-haspopup="dialog" onClick={() => setMore(true)} className="tab w-full">
              <span className="tab-icon">{icons.more}</span><span className="tab-label">More</span>
            </button>
          </li>
        </ul>
      </nav>

      <AnimatePresence>
        {more && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div className="absolute inset-0 bg-black/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)} />
            <motion.div
              role="dialog" aria-modal="true" aria-label="More"
              className="sheet absolute inset-x-0 bottom-0 mx-auto max-w-xl rounded-t-3xl border border-b-0 border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={(_, i) => { if (i.offset.y > 90 || i.velocity.y > 500) setMore(false); }}
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">More</h2>
                <div className="flex items-center gap-2"><ThemeToggle /><button type="button" aria-label="Close" onClick={() => setMore(false)} className="grid size-10 place-items-center rounded-full border border-line bg-surface [&_svg]:size-5">{icons.close}</button></div>
              </div>
              <ul className="grid grid-cols-2 gap-2.5 min-[420px]:grid-cols-3">
                {MORE.map((m) => <li key={m.href}><Link href={m.href} aria-current={is(m.href) ? 'page' : undefined} className="more-link">{m.label}</Link></li>)}
              </ul>
              <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 text-xs text-muted">{LEGAL.map(([n, h]) => <Link key={h} href={h} className="hover:text-ink">{n}</Link>)}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
