import { matchIdFromSlug, teamById } from '@apex/core';
import { getMatchById } from '@/lib/data';
import { ogCard, ogSize } from '@/lib/og';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Cricket match score';
export const dynamic = 'force-dynamic';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const m = await getMatchById(matchIdFromSlug((await params).slug));
  if (!m) return ogCard({ eyebrow: 'Live score', title: 'Match not found' });
  const cur = m.innings[m.innings.length - 1];
  const score = cur ? `${teamById(cur.battingTeamId)!.code} ${cur.runs}/${cur.wickets} (${cur.overs})` : 'Upcoming';
  return ogCard({ eyebrow: `${m.format} · ${m.status === 'live' ? 'LIVE' : m.status}`, title: `${teamById(m.team1Id)!.name} vs ${teamById(m.team2Id)!.name}`, sub: `${score} · ${m.statusLine}`, accent: teamById(m.team1Id)!.color });
}
