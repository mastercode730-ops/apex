import { toListView } from '@apex/core';
import { ensureRegistry, getAllMatches, getMatchesBySeries, getMatchesByTeam } from '@/lib/data';
import { ok, options, refsFor } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

/** GET /api/v1/matches?status=live|upcoming|completed&series=ID&team=ID */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const status = u.searchParams.get('status'), seriesId = u.searchParams.get('series'), teamId = u.searchParams.get('team');
  await ensureRegistry();
  let list = seriesId ? await getMatchesBySeries(seriesId) : teamId ? await getMatchesByTeam(teamId) : await getAllMatches();
  if (status) list = list.filter((m) => m.status === status);
  const out = list.map(toListView);
  return ok(req, out, { refs: refsFor(out) });
}
