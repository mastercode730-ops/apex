import { getArticles } from '@/lib/data';
import { ok, options } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const list = await getArticles({ category: u.searchParams.get('category') ?? undefined, limit: Math.min(Number(u.searchParams.get('limit') ?? 30), 100) });
  return ok(req, list.map(({ body, ...a }) => a), { cache: 'public, s-maxage=30' });
}
