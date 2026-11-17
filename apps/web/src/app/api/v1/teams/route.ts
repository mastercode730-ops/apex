import { teams } from '@apex/core';
import { ensureRegistry } from '@/lib/data';
import { ok, options } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const OPTIONS = options;

export async function GET(req: Request) { await ensureRegistry(); return ok(req, teams, { cache: 'public, s-maxage=60' }); }
