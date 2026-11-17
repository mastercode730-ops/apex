import { seriesById, toListView } from '@apex/core';
import { ensureRegistry, getMatchesBySeries } from '@/lib/data';
import { err, ok, options, refsFor } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureRegistry();
  const s = seriesById((await params).id);
  if (!s) return err('Series not found', 404);
  const matches = (await getMatchesBySeries(s.id)).map(toListView);
  return ok(req, { series: s, matches }, { refs: refsFor(matches) });
}
