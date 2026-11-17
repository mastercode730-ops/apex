import { seriesById } from '@apex/core';
import { ogCard, ogSize } from '@/lib/og';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Cricket series';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const s = seriesById((await params).id);
  return ogCard({ eyebrow: s?.kind ?? 'Series', title: s?.name ?? 'Series', sub: s ? s.format.join(' · ') : undefined });
}
