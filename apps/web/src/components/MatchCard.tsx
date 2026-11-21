import Link from 'next/link';
import { teamById, seriesById, type MatchView } from '@apex/core';
import { TeamBadge, LiveBadge } from './ui';
import { fmtTime, fmtDay } from '@/lib/site';

export function MatchCard({ m }: { m: MatchView }) {
  const s = seriesById(m.seriesId);
  const innFor = (teamId: string) => m.innings.find((i) => i.battingTeamId === teamId);
  const row = (teamId: string) => {
    const t = teamById(teamId)!; const i = innFor(teamId);
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3 font-semibold"><TeamBadge id={teamId} size={32} />{t.name}</span>
        {i && <span className="num font-display text-lg font-bold">{i.runs}/{i.wickets} <span className="text-xs font-medium text-muted">({i.overs})</span></span>}
      </div>
    );
  };
  return (
    <Link href={`/cricket-live-score/${m.slug}`} className={`card card-hover group relative block overflow-hidden p-4 sm:p-5 ${m.status === 'live' ? 'ring-1 ring-live/30' : ''}`}>
      {m.status === 'live' && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-live via-accent to-blue" />}
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted">
        <span className="truncate">{m.title.split(', ')[1]} · {s?.short}</span>
        {m.status === 'live' ? <LiveBadge /> : m.status === 'completed' ? <span className="font-semibold">Result</span> : <span className="font-semibold">Upcoming</span>}
      </div>
      <div className="grid gap-2.5">{row(m.team1Id)}{row(m.team2Id)}</div>
      <p className={`mt-3 border-t border-line pt-3 text-sm font-medium transition-colors group-hover:text-ink ${m.status === 'live' ? 'text-accent' : 'text-muted'}`}>
        {m.status === 'upcoming' ? `${fmtDay(m.startTime)} · ${fmtTime(m.startTime)}` : m.statusLine}
      </p>
    </Link>
  );
}
