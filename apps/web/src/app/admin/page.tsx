import { cookies } from 'next/headers';
import { teams } from '@apex/core';
import * as db from '@apex/db';
import { ADMIN_COOKIE, adminConfigured, validSession } from '@/lib/adminAuth';
import { getSeriesList } from '@/lib/data';
import { AdminApp, AdminLogin } from '@/components/admin';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const signedIn = validSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!signedIn) return <AdminLogin configured={adminConfigured()} />;
  const series = (await getSeriesList()).map((s) => ({ id: s.id, name: s.name }));
  return <AdminApp series={series} teams={teams.map((t) => ({ id: t.id, name: t.name }))} dbReady={db.dbConfigured()} />;
}
