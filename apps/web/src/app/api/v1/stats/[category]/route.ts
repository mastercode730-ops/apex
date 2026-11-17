import { statCategories } from '@apex/core';
import { ensureRegistry, getSeriesList, getStatLeaders } from '@/lib/data';
import { err, ok, options } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

export async function GET(req: Request, { params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!statCategories.some((c) => c.id === category)) return err('Unknown stat category', 404);
  await ensureRegistry();
  const sid = new URL(req.url).searchParams.get('series') ?? (await getSeriesList())[0]?.id ?? '';
  return ok(req, await getStatLeaders(category, sid), { cache: 'public, s-maxage=120' });
}
