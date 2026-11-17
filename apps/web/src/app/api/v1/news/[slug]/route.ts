import { getArticle } from '@/lib/data';
import { err, ok, options } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const a = await getArticle((await params).slug);
  return a ? ok(req, a, { cache: 'public, s-maxage=30' }) : err('Article not found', 404);
}
