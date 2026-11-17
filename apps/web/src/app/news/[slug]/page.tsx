import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articleBySlug, articles, categoryLabels } from '@apex/core';
import { Breadcrumbs, JsonLd } from '@/components/ui';
import { pageMeta, fmtDate, SITE } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const a = articleBySlug((await params).slug);
  if (!a) return { title: 'Article not found' };
  return pageMeta({ title: a.title, description: a.excerpt, path: `/news/${a.slug}`, type: 'article' });
}

export default async function Article({ params }: Props) {
  const a = articleBySlug((await params).slug); if (!a) notFound();
  const more = articles.filter((x) => x.id !== a.id && x.category === a.category).slice(0, 3);
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'NewsArticle', headline: a.title, datePublished: a.publishedAt, author: { '@type': 'Person', name: a.author }, publisher: { '@type': 'Organization', name: SITE.name }, mainEntityOfPage: `${SITE.url}/news/${a.slug}`, description: a.excerpt }} />
      <Breadcrumbs items={[{ name: 'News', href: '/news' }, { name: categoryLabels[a.category], href: `/news?category=${a.category}` }, { name: a.title, href: `/news/${a.slug}` }]} />
      <p className="text-xs font-bold uppercase tracking-wider text-accent">{categoryLabels[a.category]}</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{a.title}</h1>
      <p className="mt-4 text-sm text-muted">By {a.author} · <time dateTime={a.publishedAt}>{fmtDate(a.publishedAt)}</time></p>
      <div className="mt-8 grid gap-5 text-lg leading-relaxed">{a.body.map((p, i) => <p key={i} className={i === 0 ? 'text-xl font-medium' : 'text-muted'}>{p}</p>)}</div>
      {more.length > 0 && <aside className="mt-14 border-t border-line pt-8"><h2 className="mb-4 font-display text-xl font-bold">Related stories</h2><ul className="grid gap-3">{more.map((m) => <li key={m.id}><Link href={`/news/${m.slug}`} className="font-semibold text-accent hover:underline">{m.title}</Link></li>)}</ul></aside>}
    </article>
  );
}
