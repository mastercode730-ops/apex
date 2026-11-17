import { teamById } from '@apex/core';
import { ogCard, ogSize } from '@/lib/og';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Cricket team';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const t = teamById((await params).id);
  return ogCard({ eyebrow: 'Team', title: t?.name ?? 'Team', sub: t ? `Squad, fixtures, rankings and news · Since ${t.since}` : undefined, accent: t?.color });
}
