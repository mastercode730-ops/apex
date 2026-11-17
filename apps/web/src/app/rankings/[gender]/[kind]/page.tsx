import { notFound } from 'next/navigation';
import Link from 'next/link';
import { rankings, type RankFormat } from '@apex/core';
import { Breadcrumbs, PageTitle, TeamBadge } from '@/components/ui';
import { pageMeta } from '@/lib/site';

const KINDS = [['team', 'Teams'], ['batter', 'Batters'], ['bowler', 'Bowlers'], ['allrounder', 'All-rounders']] as const;
const FORMATS: RankFormat[] = ['TEST', 'ODI', 'T20'];
type Props = { params: Promise<{ gender: string; kind: string }>; searchParams: Promise<{ format?: string }> };

export async function generateMetadata({ params }: Props) {
  const { gender, kind } = await params;
  const k = KINDS.find((x) => x[0] === kind);
  if (!['men', 'women'].includes(gender) || !k) return { title: 'Rankings not found' };
  const g = gender === 'women' ? "Women's" : "Men's";
  return pageMeta({ title: `ICC ${g} ${k[1]} Rankings: Test, ODI & T20I`, description: `Current ${g.toLowerCase()} ${k[1].toLowerCase()} cricket rankings with rating and movement.`, path: `/rankings/${gender}/${kind}` });
}

export default async function Rankings({ params, searchParams }: Props) {
  const { gender, kind } = await params; const { format = 'T20' } = await searchParams;
  const k = KINDS.find((x) => x[0] === kind);
  if (!['men', 'women'].includes(gender) || !k) notFound();
  const g = gender as 'men' | 'women';
  const f = (FORMATS.includes(format as RankFormat) ? format : 'T20') as RankFormat;
  const rows = rankings(k[0], f, g);
  const [lead, ...rest] = rows;
  return (
    <>
      <Breadcrumbs items={[{ name: 'Rankings', href: `/rankings/${g}/team` }, { name: k[1], href: `/rankings/${g}/${kind}` }]} />
      <PageTitle sub="Demo ratings for illustration.">{g === 'women' ? 'Women' : 'Men'}&apos;s {k[1]} Rankings</PageTitle>
      <div className="mb-3 flex gap-2">{(['men', 'women'] as const).map((x) => <Link key={x} href={`/rankings/${x}/${kind}?format=${f}`} className="chip capitalize" aria-current={x === g ? 'true' : undefined}>{x}</Link>)}</div>
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">{KINDS.map(([id, l]) => <Link key={id} href={`/rankings/${g}/${id}?format=${f}`} className="chip" aria-current={id === kind ? 'true' : undefined}>{l}</Link>)}</div>
      <div className="mb-6 flex gap-2">{FORMATS.map((x) => <Link key={x} href={`/rankings/${g}/${kind}?format=${x}`} className="chip" aria-current={x === f ? 'true' : undefined}>{x}</Link>)}</div>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="card relative overflow-hidden p-8 text-center">
          <div aria-hidden="true" className="absolute inset-x-0 -top-16 mx-auto size-56 rounded-full bg-accent/25 blur-3xl" />
          <p className="relative text-xs font-bold uppercase tracking-[.25em] text-accent">No. 1 · {f}</p>
          <div className="relative my-4 flex justify-center"><TeamBadge id={lead.teamId} size={88} /></div>
          <h2 className="relative font-display text-2xl font-extrabold">{lead.playerId ? <Link href={`/player/${lead.playerId}`} className="hover:underline">{lead.name}</Link> : lead.name}</h2>
          <p className="num relative mt-2 font-display text-5xl font-extrabold text-accent">{lead.rating}</p><p className="relative text-xs font-bold uppercase text-muted">Rating</p>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm"><caption className="sr-only">{k[1]} ranking, {f}</caption>
            <thead className="bg-surface2 text-left text-xs uppercase text-muted"><tr><th scope="col" className="px-5 py-3">Rank</th><th scope="col">Name</th><th scope="col">Team</th><th scope="col" className="pr-5 text-right">Rating</th></tr></thead>
            <tbody>{rest.map((r) => { const mv = r.prev - r.rank; return (
              <tr key={r.rank} className="border-t border-line transition hover:bg-surface2"><td className="num px-5 py-3 font-bold">{r.rank} <span className={mv > 0 ? 'text-good' : mv < 0 ? 'text-live' : 'text-muted'} aria-label={mv > 0 ? 'up' : mv < 0 ? 'down' : 'no change'}>{mv > 0 ? '▲' : mv < 0 ? '▼' : '–'}</span></td>
                <td className="font-semibold">{r.playerId ? <Link href={`/player/${r.playerId}`} className="hover:underline">{r.name}</Link> : <Link href={`/team/${r.teamId}`} className="hover:underline">{r.name}</Link>}</td>
                <td><TeamBadge id={r.teamId} size={24} /></td><td className="num pr-5 text-right font-bold">{r.rating}</td></tr>); })}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
