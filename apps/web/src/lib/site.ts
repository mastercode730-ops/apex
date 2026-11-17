import type { Metadata } from 'next';

export const SITE = {
  name: 'Apex',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  tagline: 'Live cricket scores, scorecards, fixtures, rankings and stats',
  description: 'Apex delivers ball-by-ball live cricket scores, scorecards, commentary, fixtures, series, team and player pages, ICC-style rankings and stats.',
};

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/cricket-live-score', label: 'Live' },
  { href: '/series', label: 'Series' },
  { href: '/team', label: 'Teams' },
  { href: '/schedule', label: 'Fixtures' },
  { href: '/stats', label: 'Stats' },
  { href: '/rankings/men/team', label: 'Rankings' },
  { href: '/news', label: 'News' },
];

export function pageMeta(opts: { title: string; description: string; path: string; type?: 'website' | 'article'; noindex?: boolean; ownImage?: boolean }): Metadata {
  const url = `${SITE.url}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
    openGraph: { title: opts.title, description: opts.description, url, siteName: SITE.name, type: opts.type ?? 'website', ...(opts.ownImage ? {} : { images: [{ url: `${SITE.url}/opengraph-image`, width: 1200, height: 630, alt: `${SITE.name} cricket` }] }) },
    twitter: { card: 'summary_large_image', title: opts.title, description: opts.description, ...(opts.ownImage ? {} : { images: [`${SITE.url}/opengraph-image`] }) },
  };
}

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
export function timeAgo(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} hr ago`;
  return fmtDate(iso);
}
