import { ensureRegistry, getMatchById } from '@/lib/data';
import { err, ok, options, refsFor } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

/** GET /api/v1/matches/:id  full scorecard, commentary, recent overs. Poll every 5-10 s while live. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureRegistry();
  const m = await getMatchById((await params).id);
  if (!m) return err('Match not found', 404);
  return ok(req, m, { refs: refsFor([m]), cache: m.status === 'live' ? 'public, s-maxage=2, stale-while-revalidate=10' : 'public, s-maxage=60' });
}
