import Link from 'next/link';
import { categoryLabels, type Article } from '@apex/core';
import { Breadcrumbs, PageTitle } from '@/components/ui';
import { Reveal } from '@/components/client';
import { pageMeta, timeAgo } from '@/lib/site';
import { getArticles } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = pageMeta({ title: 'Cricket News, Records, Analysis & Predictions', description: 'Latest cricket news, records, analysis, predictions, reactions and features from Apex.', path: '/news' });

export default async function News({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const valid = category && category in categoryLabels ? category : undefined;
  const list = await getArticles({ category: valid });
  return (
    <>
      <Breadcrumbs items={[{ name: 'News', href: '/news' }]} />
      <PageTitle sub="Stories, stats and takes from around the game.">Cricket News</PageTitle>
      <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Link href="/news" className="chip" aria-current={!valid ? 'true' : undefined}>All</Link>
        {(Object.keys(categoryLabels) as Article['category'][]).map((c) => <Link key={c} href={`/news?category=${c}`} className="chip" aria-current={valid === c ? 'true' : undefined}>{categoryLabels[c]}</Link>)}
      </div>
      {!list.length && <p className="card p-8 text-center text-muted">No stories published yet.</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((a, i) => (
          <Reveal key={a.id} delay={(i % 3) * 0.07}>
            <Link href={`/news/${a.slug}`} className="card card-hover block h-full p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-accent">{categoryLabels[a.category]}</p>
              <h2 className="mt-2 font-display text-lg font-bold leading-snug">{a.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{a.excerpt}</p>
              <p className="mt-4 text-xs text-muted">{a.author} · {timeAgo(a.publishedAt)}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  );
}
