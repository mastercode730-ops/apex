import Link from 'next/link';
import { teamById, type MatchView } from '@apex/core';
import { TeamBadge } from './ui';
import { fmtDay, fmtTime } from '@/lib/site';

/** Compact scoreboard card for the horizontal "Top Matches" strip. */
export function StripCard({ m }: { m: MatchView }) {
  const cur = m.innings[m.innings.length - 1];
  const row = (teamId: string) => {
    const t = teamById(teamId)!;
    const i = m.innings.find((x) => x.battingTeamId === teamId);
    const batting = m.status === 'live' && cur?.battingTeamId === teamId;
    return (
      <div className="flex items-center gap-3">
        <TeamBadge id={teamId} size={28} />
        <span className="w-10 shrink-0 font-semibold">{t.code}</span>
        {i ? (
          <span className="num flex items-baseline gap-1.5">
            <b className={`text-lg ${batting ? 'text-blue' : ''}`}>{i.runs}-{i.wickets}</b>
            <span className="text-xs text-muted">{i.overs}</span>
            {batting && <span aria-label="batting" className="text-accent">🏏</span>}
          </span>
        ) : <span className="text-sm text-muted">{m.status === 'upcoming' ? '' : 'Yet to bat'}</span>}
      </div>
    );
  };
  const side = m.status === 'live' ? <span className="flex items-center gap-1.5 font-semibold text-live"><span className="live-dot" />Live</span>
    : m.status === 'completed' ? <span className="font-semibold text-muted">Result</span>
    : <span className="text-center text-xs font-semibold text-muted">{fmtDay(m.startTime).replace(/ \d{4}$/, '')}<br />{fmtTime(m.startTime)}</span>;
  return (
    <Link href={`/cricket-live-score/${m.slug}`} className="strip-card card card-hover group block">
      <p className="truncate text-xs text-muted">{m.title.split(', ')[1]}, {m.venue}, {m.city}</p>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
        <div className="grid gap-2.5">{row(m.team1Id)}{row(m.team2Id)}</div>
        <div className="grid min-w-[4.5rem] place-items-center border-l border-line pl-3">{side}</div>
      </div>
      <p className={`mt-3 truncate text-xs font-medium ${m.status === 'live' ? 'text-accent' : 'text-muted'}`}>{m.status === 'upcoming' ? `${m.format} · ${m.title.split(', ')[0]}` : m.statusLine}</p>
    </Link>
  );
}
