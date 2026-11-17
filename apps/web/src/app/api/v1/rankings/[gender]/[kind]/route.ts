import type { RankFormat, RankKind } from '@apex/core';
import { ensureRegistry, getRankings } from '@/lib/data';
import { err, ok, options } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

/** GET /api/v1/rankings/men/team?format=TEST|ODI|T20 */
export async function GET(req: Request, { params }: { params: Promise<{ gender: string; kind: string }> }) {
  const { gender, kind } = await params;
  const format = (new URL(req.url).searchParams.get('format') ?? 'T20').toUpperCase();
  if (!['men', 'women'].includes(gender) || !['team', 'batter', 'bowler', 'allrounder'].includes(kind) || !['TEST', 'ODI', 'T20'].includes(format)) return err('Invalid ranking', 400);
  await ensureRegistry();
  return ok(req, await getRankings(kind as RankKind, format as RankFormat, gender as 'men' | 'women'), { cache: 'public, s-maxage=300' });
}
