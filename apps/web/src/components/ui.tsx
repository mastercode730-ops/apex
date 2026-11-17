import Link from 'next/link';
import { teamById, playerById } from '@apex/core';
import { SITE } from '@/lib/site';

export function TeamBadge({ id, size = 36 }: { id: string; size?: number }) {
  const t = teamById(id);
  if (!t) return null;
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center rounded-full font-display font-bold text-white ring-2 ring-white/10"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${t.color}, color-mix(in srgb, ${t.color} 55%, #000))`, fontSize: size * 0.34 }}
    >
      {t.code.slice(0, 3)}
    </span>
  );
}

export function PlayerAvatar({ id, size = 40 }: { id: string; size?: number }) {
  const p = playerById(id);
  const t = p && teamById(p.teamId);
  const initials = (p?.name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('');
  return (
    <span aria-hidden="true" className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, background: t ? `linear-gradient(135deg, ${t.color}, #111827)` : '#333', fontSize: size * 0.36 }}>
      {initials}
    </span>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-live/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-live">
      <span className="live-dot" /> Live
    </span>
  );
}

export function SectionHeader({ title, href, linkLabel = 'View all', id }: { title: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 id={id} className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      {href && <Link href={href} className="text-sm font-semibold text-accent hover:underline">{linkLabel} →</Link>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  const all = [{ name: 'Home', href: '/' }, ...items];
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: all.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE.url}${it.href}` })),
  };
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((it, i) => (
            <li key={it.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === all.length - 1 ? <span aria-current="page" className="text-ink">{it.name}</span> : <Link href={it.href} className="hover:text-ink hover:underline">{it.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={ld} />
    </>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export function TabLinks({ tabs, current }: { tabs: { href: string; label: string; key: string }[]; current: string }) {
  return (
    <div role="tablist" aria-label="Sections" className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} role="tab" aria-selected={t.key === current} aria-current={t.key === current ? 'true' : undefined} className="chip" scroll={false}>{t.label}</Link>
      ))}
    </div>
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <header className="mb-6 float-in">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{children}</h1>
      {sub && <p className="mt-2 max-w-2xl text-muted">{sub}</p>}
    </header>
  );
}
