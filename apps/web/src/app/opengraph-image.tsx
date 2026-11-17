import { ImageResponse } from 'next/og';

export const alt = 'Apex: live cricket scores';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg,#080b12,#16213a)', color: '#eef2fb' }}>
        <div style={{ fontSize: 40, color: '#c6ff3d', fontWeight: 800, letterSpacing: 8 }}>APEX</div>
        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>Live cricket, at the speed of the game.</div>
        <div style={{ fontSize: 32, color: '#94a0b8', marginTop: 28 }}>Scores · Scorecards · Fixtures · Rankings · Stats</div>
      </div>
    ),
    size,
  );
}
