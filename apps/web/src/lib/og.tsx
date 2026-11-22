import { ImageResponse } from 'next/og';
import { LOGO_DATA_URI } from './logo';

export const ogSize = { width: 1200, height: 630 };

export function ogCard({ eyebrow, title, sub, accent = '#c6ff3d' }: { eyebrow: string; title: string; sub?: string; accent?: string }) {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg,#080b12,#16213a)', color: '#eef2fb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 34, fontWeight: 800 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 20, color: accent, letterSpacing: 8 }}><img src={LOGO_DATA_URI} width={64} height={64} alt="" />APEX</span><span style={{ color: '#94a0b8', fontSize: 28 }}>{eyebrow}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: title.length > 40 ? 64 : 84, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
          {sub && <div style={{ fontSize: 34, color: '#94a0b8', marginTop: 24 }}>{sub}</div>}
        </div>
        <div style={{ height: 10, width: 220, background: accent, borderRadius: 6 }} />
      </div>
    ),
    ogSize,
  );
}
