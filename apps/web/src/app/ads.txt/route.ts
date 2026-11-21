/** /ads.txt: required by AdSense/ad exchanges. Generated from NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-123 -> pub-123). */
export const dynamic = 'force-static';
export function GET() {
  const pub = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '').replace(/^ca-/, '');
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : '# No advertising configured.\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
