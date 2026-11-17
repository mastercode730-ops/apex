import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMatch, matchIdFromSlug, teamById, playerById, seriesById, squadOf } from '@apex/core';
import { Breadcrumbs, JsonLd, LiveBadge, PageTitle, PlayerAvatar, TabLinks, TeamBadge } from '@/components/ui';
import { AnimatedNumber, LiveRefresh, WinProb } from '@/components/client';
import { pageMeta, fmtDay, fmtTime, SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string; f?: string }> };
const FILTERS = [['all', 'All'], ['wicket', 'Wickets'], ['six', 'Sixes'], ['four', 'Fours']] as const;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const m = getMatch(matchIdFromSlug(slug));
  if (!m) return { title: 'Match not found' };
  const s = seriesById(m.seriesId);
  return pageMeta({ title: `${m.title} Live Score, Scorecard & Commentary | ${s?.short}`, description: `${m.title} at ${m.venue}, ${m.city}. ${m.statusLine}. Live score, full scorecard and ball-by-ball commentary.`, path: `/cricket-live-score/${m.slug}` , ownImage: true });
}

const TABS = [['live', 'Live'], ['scorecard', 'Scorecard'], ['commentary', 'Commentary'], ['squads', 'Squads'], ['info', 'Match info']] as const;

export default async function MatchPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = 'live', f = 'all' } = await searchParams;
  const m = getMatch(matchIdFromSlug(slug));
  if (!m || slug !== m.slug) notFound();
  const s = seriesById(m.seriesId)!;
  const t1 = teamById(m.team1Id)!, t2 = teamById(m.team2Id)!;
  const cur = m.innings[m.innings.length - 1];
  const base = `/cricket-live-score/${m.slug}`;
  const nm = (id: string) => playerById(id)?.name ?? id;
  const ld = { '@context': 'https://schema.org', '@type': 'SportsEvent', name: m.title, startDate: m.startTime, location: { '@type': 'Place', name: `${m.venue}, ${m.city}` }, competitor: [t1, t2].map((t) => ({ '@type': 'SportsTeam', name: t.name })), url: `${SITE.url}${base}`, sport: 'Cricket' };
  return (
    <>
      {m.status === 'live' && <LiveRefresh every={4000} matchId={m.id} />}
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ name: 'Live Scores', href: '/cricket-live-score' }, { name: s.short, href: `/series/${s.id}` }, { name: m.title, href: base }]} />
      <PageTitle>{t1.name} vs {t2.name}, {m.title.split(', ')[1]}</PageTitle>

      <section aria-label="Scoreboard" className="card relative mb-6 overflow-hidden p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <span>{s.name} · {m.format}</span>
          {m.status === 'live' ? <LiveBadge /> : <span className="font-semibold">{m.status === 'completed' ? 'Completed' : 'Upcoming'}</span>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {[t1, t2].map((t) => {
            const inn = m.innings.find((i) => i.battingTeamId === t.id);
            return (
              <div key={t.id} className="flex items-center gap-4">
                <TeamBadge id={t.id} size={56} />
                <div>
                  <p className="font-semibold text-muted">{t.name}</p>
                  {inn ? <p className="font-display text-4xl font-extrabold"><AnimatedNumber value={inn.runs} />/<AnimatedNumber value={inn.wickets} /> <span className="text-base font-medium text-muted">({inn.overs})</span></p> : <p className="font-display text-2xl text-muted">Yet to bat</p>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-lg font-bold text-accent">{m.status === 'upcoming' ? `${fmtDay(m.startTime)} · ${fmtTime(m.startTime)}` : m.statusLine}</p>
        {cur && <p className="mt-1 text-sm text-muted num">Run rate {cur.runRate}{cur.target ? ` · Target ${cur.target}` : ''} · Partnership {cur.partnership.runs} ({cur.partnership.balls})</p>}
        {m.winProb && <div className="mt-6"><WinProb t1={t1.code} t2={t2.code} p1={m.winProb.team1} /></div>}
      </section>

      <TabLinks current={tab} tabs={TABS.map(([k, l]) => ({ key: k, label: l, href: k === 'live' ? base : `${base}?tab=${k}` }))} />

      {(tab === 'live') && (
        <div className="grid gap-6 lg:grid-cols-2">
          {cur ? (
            <>
              <section className="card p-5" aria-label="At the crease">
                <h2 className="mb-3 font-display text-lg font-bold">At the crease</h2>
                <ul className="divide-y divide-line">
                  {cur.batting.filter((b) => !b.out).slice(0, 2).map((b) => (
                    <li key={b.playerId} className="flex items-center gap-3 py-2.5"><PlayerAvatar id={b.playerId} size={36} />
                      <Link href={`/player/${b.playerId}`} className="flex-1 font-semibold hover:underline">{nm(b.playerId)}{b.onStrike && ' *'}</Link>
                      <span className="num font-bold">{b.runs} <span className="text-xs font-normal text-muted">({b.balls}) {b.fours}x4 {b.sixes}x6</span></span></li>
                  ))}
                </ul>
                {cur.bowling.length > 0 && <p className="mt-3 border-t border-line pt-3 text-sm text-muted">Bowling: <b className="text-ink">{nm(cur.bowling[cur.bowling.length - 1].playerId)}</b> {cur.bowling[cur.bowling.length - 1].wickets}-{cur.bowling[cur.bowling.length - 1].runs} ({cur.bowling[cur.bowling.length - 1].overs})</p>}
              </section>
              <section className="card p-5" aria-label="Recent overs">
                <h2 className="mb-3 font-display text-lg font-bold">Recent overs</h2>
                {m.recentOvers.map((o) => (
                  <div key={o.over} className="flex items-center gap-3 py-2"><span className="w-14 text-sm text-muted">Over {o.over}</span>
                    <div className="flex flex-1 flex-wrap gap-1.5">{o.balls.map((b, i) => <span key={i} className={`ball grid size-8 place-items-center rounded-full text-xs font-bold ${b === 'W' ? 'bg-live text-white' : b === '6' ? 'bg-accent text-accentink' : b === '4' ? 'bg-blue text-white' : 'bg-surface2'}`}>{b}</span>)}</div>
                    <span className="num text-sm font-bold">{o.runs}</span></div>
                ))}
              </section>
              <section className="card p-5 lg:col-span-2" aria-label="Latest commentary">
                <h2 className="mb-3 font-display text-lg font-bold">Latest commentary</h2>
                <Commentary items={m.commentary.slice(0, 8)} />
              </section>
            </>
          ) : <p className="card p-8 text-center text-muted lg:col-span-2">This match has not started yet. Come back at {fmtTime(m.startTime)}.</p>}
        </div>
      )}

      {tab === 'scorecard' && (m.innings.length ? m.innings.map((inn, idx) => (
        <section key={idx} className="card mb-6 overflow-hidden" aria-label={`Innings ${idx + 1}`}>
          <h2 className="flex items-center justify-between bg-surface2 px-5 py-3 font-display text-lg font-bold"><span>{teamById(inn.battingTeamId)!.name}, innings {idx + 1}</span><span className="num">{inn.runs}/{inn.wickets} ({inn.overs})</span></h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm"><caption className="sr-only">Batting</caption>
              <thead className="text-left text-xs uppercase text-muted"><tr><th scope="col" className="px-5 py-2">Batter</th><th scope="col">R</th><th scope="col">B</th><th scope="col">4s</th><th scope="col">6s</th><th scope="col">SR</th></tr></thead>
              <tbody>{inn.batting.map((b) => (<tr key={b.playerId} className="border-t border-line"><td className="px-5 py-2.5"><Link href={`/player/${b.playerId}`} className="font-semibold hover:underline">{nm(b.playerId)}</Link><div className="text-xs text-muted">{b.out ?? 'not out'}</div></td><td className="num font-bold">{b.runs}</td><td className="num">{b.balls}</td><td className="num">{b.fours}</td><td className="num">{b.sixes}</td><td className="num">{b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}</td></tr>))}</tbody>
            </table>
            <p className="border-t border-line px-5 py-3 text-sm text-muted">Extras {inn.extras} · Run rate {inn.runRate}</p>
            <table className="w-full min-w-[34rem] text-sm"><caption className="sr-only">Bowling</caption>
              <thead className="border-t border-line text-left text-xs uppercase text-muted"><tr><th scope="col" className="px-5 py-2">Bowler</th><th scope="col">O</th><th scope="col">R</th><th scope="col">W</th><th scope="col">Econ</th></tr></thead>
              <tbody>{inn.bowling.map((b) => (<tr key={b.playerId} className="border-t border-line"><td className="px-5 py-2.5 font-semibold">{nm(b.playerId)}</td><td className="num">{b.overs}</td><td className="num">{b.runs}</td><td className="num font-bold">{b.wickets}</td><td className="num">{b.econ}</td></tr>))}</tbody>
            </table>
            {inn.fallOfWickets.length > 0 && <p className="border-t border-line px-5 py-3 text-sm text-muted"><b className="text-ink">Fall of wickets:</b> {inn.fallOfWickets.map((f) => `${f.runs}-${f.wicket} (${nm(f.playerId)}, ${f.over} ov)`).join(', ')}</p>}
          </div>
        </section>
      )) : <p className="card p-8 text-center text-muted">Scorecard will appear once play begins.</p>)}

      {tab === 'commentary' && (() => { const items = f === 'all' ? m.commentary : m.commentary.filter((c) => c.kind === f); return (
        <section className="card p-5" aria-label="Commentary">
          <div className="mb-4 flex flex-wrap gap-2">{FILTERS.map(([k, l]) => <Link key={k} href={`${base}?tab=commentary&f=${k}`} scroll={false} className="chip" aria-current={f === k ? 'true' : undefined}>{l}</Link>)}</div>
          <Commentary items={items} />{!items.length && <p className="text-muted">Nothing here yet.</p>}</section>); })()}

      {tab === 'squads' && (
        <div className="grid gap-6 md:grid-cols-2">{[t1, t2].map((t) => (
          <section key={t.id} className="card p-5"><h2 className="mb-3 flex items-center gap-3 font-display text-lg font-bold"><TeamBadge id={t.id} size={32} />{t.name}</h2>
            <ul className="divide-y divide-line">{squadOf(t.id).map((p) => <li key={p.id} className="flex items-center gap-3 py-2"><PlayerAvatar id={p.id} size={32} /><Link href={`/player/${p.id}`} className="flex-1 font-semibold hover:underline">{p.name}</Link><span className="text-xs text-muted">{p.role}</span></li>)}</ul></section>
        ))}</div>
      )}

      {tab === 'info' && (
        <dl className="card grid gap-4 p-6 sm:grid-cols-2">
          {[['Match', m.title], ['Series', s.name], ['Format', m.format], ['Venue', `${m.venue}, ${m.city}`], ['Date', `${fmtDay(m.startTime)} ${fmtTime(m.startTime)}`], ['Toss', m.toss ?? ''], ['Umpires', m.umpires.join(', ')]].map(([k, v]) => (
            <div key={k}><dt className="text-xs font-bold uppercase tracking-wider text-muted">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>
          ))}
        </dl>
      )}
    </>
  );
}

function Commentary({ items }: { items: { id: string; over: string; text: string; kind: string; runs: number }[] }) {
  return (
    <ol className="divide-y divide-line">
      {items.map((c) => (
        <li key={c.id} className="flex gap-4 py-3">
          <span className={`num grid h-8 w-12 shrink-0 place-items-center rounded-lg text-xs font-bold ${c.kind === 'wicket' ? 'bg-live text-white' : c.kind === 'six' ? 'bg-accent text-accentink' : c.kind === 'four' ? 'bg-blue text-white' : 'bg-surface2'}`}>{c.over}</span>
          <p className={c.kind === 'wicket' ? 'font-bold' : ''}>{c.text}</p>
        </li>
      ))}
    </ol>
  );
}
