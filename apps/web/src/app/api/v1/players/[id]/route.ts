import { playerById } from '@apex/core';
import { ensurePlayer, getCareer } from '@/lib/data';
import { err, ok, options } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id; await ensurePlayer(id);
  const p = playerById(id);
  if (!p) return err('Player not found', 404);
  return ok(req, { player: p, career: await getCareer(p.id) }, { cache: 'public, s-maxage=300' });
}
