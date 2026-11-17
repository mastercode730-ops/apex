import { getSeriesList } from '@/lib/data';
import { ok, options } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

export async function GET(req: Request) { return ok(req, await getSeriesList(), { cache: 'public, s-maxage=30' }); }
