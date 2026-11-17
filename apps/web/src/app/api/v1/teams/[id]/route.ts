import { squadOf, teamById, toListView } from '@apex/core';
import { ensureRegistry, getMatchesByTeam } from '@/lib/data';
import { err, ok, options, refsFor } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureRegistry();
  const t = teamById((await params).id);
  if (!t) return err('Team not found', 404);
  const matches = (await getMatchesByTeam(t.id)).map(toListView);
  return ok(req, { team: t, squad: squadOf(t.id), matches }, { refs: refsFor(matches) });
}
