import { notFound } from 'next/navigation';
import Link from 'next/link';
import { playerById, teamById, rankings, careerStats } from '@apex/core';
import { Breadcrumbs, JsonLd, PageTitle, PlayerAvatar } from '@/components/ui';
import { pageMeta, SITE } from '@/lib/site';
import { ensurePlayer } from '@/lib/data';

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
  const pid = (await params).id; await ensurePlayer(pid);
  const p = playerById(pid);
  if (!p) return { title: 'Player not found' };
  return pageMeta({ title: `${p.name}: Profile, Stats & Rankings`, description: `${p.name} (${teamById(p.teamId)?.name}), ${p.role}. Batting style: ${p.battingStyle}. Career profile, rankings and stats.`, path: `/player/${p.id}` });
}

export default async function Player({ params }: Props) {
  const pid = (await params).id; await ensurePlayer(pid);
  const p = playerById(pid); if (!p) notFound();
  const t = teamById(p.teamId)!;
  const ranks = (['batter', 'bowler', 'allrounder'] as const).flatMap((k) => (['TEST', 'ODI', 'T20'] as const).map((f) => ({ k, f, r: rankings(k, f).find((x) => x.playerId === p.id) }))).filter((x) => x.r);
  const info: [string, string][] = [['Team', t.name], ['Role', p.role], ['Batting', p.battingStyle], ['Bowling', p.bowlingStyle], ['Born', p.born]];
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Person', name: p.name, jobTitle: 'Cricketer', memberOf: { '@type': 'SportsTeam', name: t.name }, url: `${SITE.url}/player/${p.id}` }} />
      <Breadcrumbs items={[{ name: 'Teams', href: '/team' }, { name: t.name, href: `/team/${t.id}` }, { name: p.name, href: `/player/${p.id}` }]} />
      <div className="mb-6 flex items-center gap-5"><PlayerAvatar id={p.id} size={88} /><PageTitle sub={`${p.role} · ${t.name}`}>{p.name}</PageTitle></div>
      <div className="grid gap-6 md:grid-cols-2">
        <dl className="card grid gap-3 p-6">{info.map(([k, v]) => <div key={k} className="flex justify-between border-b border-line pb-2 last:border-0"><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
        <section className="card p-6"><h2 className="font-display text-lg font-bold">ICC rankings</h2>
          {ranks.length ? <ul className="mt-3 grid gap-2">{ranks.map(({ k, f, r }) => <li key={k + f} className="flex justify-between rounded-xl bg-surface2 px-4 py-2.5"><span className="capitalize">{k} · {f}</span><span className="num font-bold text-accent">#{r!.rank} ({r!.rating})</span></li>)}</ul> : <p className="mt-3 text-muted">Not currently ranked.</p>}
          <Link href={`/team/${t.id}?tab=squad`} className="mt-4 inline-block text-sm font-semibold text-accent">View {t.name} squad →</Link></section>
      </div>
      <section className="card mt-6 overflow-x-auto" aria-label="Career statistics"><h2 className="px-6 pt-5 font-display text-lg font-bold">Career statistics (demo)</h2>
        <table className="mt-3 w-full min-w-[34rem] text-sm"><caption className="sr-only">Career stats by format</caption>
          <thead className="bg-surface2 text-left text-xs uppercase text-muted"><tr><th scope="col" className="px-6 py-2">Format</th><th scope="col">Mat</th><th scope="col">Runs</th><th scope="col">Avg</th><th scope="col">SR</th><th scope="col">100s</th><th scope="col">Wkts</th><th scope="col">Econ</th><th scope="col">BBI</th></tr></thead>
          <tbody>{careerStats(p.id).map((c) => <tr key={c.format} className="border-t border-line"><th scope="row" className="px-6 py-2.5 text-left">{c.format}</th><td className="num">{c.matches}</td><td className="num font-bold">{c.runs}</td><td className="num">{c.avg}</td><td className="num">{c.sr}</td><td className="num">{c.hundreds}</td><td className="num">{c.wickets}</td><td className="num">{c.econ}</td><td className="num">{c.best}</td></tr>)}</tbody></table></section>
    </>
  );
}
