import type { MetadataRoute } from 'next';
import { teams, players, series, articles, allMatches, statCategories } from '@apex/core';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string, priority = 0.6, changeFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily', lastModified = new Date()) => ({ url: `${SITE.url}${p}`, lastModified, changeFrequency, priority });
  return [
    u('/', 1, 'hourly'), u('/cricket-live-score', 0.9, 'hourly'), u('/schedule', 0.8), u('/series', 0.8), u('/team', 0.7, 'weekly'), u('/news', 0.8, 'hourly'),
    ...(['men', 'women'].flatMap((g) => ['team', 'batter', 'bowler', 'allrounder'].map((k) => u(`/rankings/${g}/${k}`, 0.7, 'weekly')))),
    ...statCategories.map((c) => u(`/stats/${c.id}`, 0.6)),
    ...allMatches().map((m) => u(`/cricket-live-score/${m.slug}`, 0.8, 'hourly')),
    ...series.map((s) => u(`/series/${s.id}`, 0.7)),
    ...teams.map((t) => u(`/team/${t.id}`, 0.6, 'weekly')),
    ...players.map((p) => u(`/player/${p.id}`, 0.5, 'weekly')),
    ...articles.map((a) => u(`/news/${a.slug}`, 0.6, 'monthly', new Date(a.publishedAt))),
    u('/contact', 0.3, 'monthly'), u('/privacy-policy', 0.3, 'monthly'), u('/terms-and-conditions', 0.3, 'monthly'),
  ];
}
