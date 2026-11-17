import { getMatchById } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Server-Sent Events: emits a change signature whenever the match state moves. Clients refresh on change. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id.toUpperCase();
  if (!(await getMatchById(id))) return new Response('Not found', { status: 404 });
  const enc = new TextEncoder();
  let timer: ReturnType<typeof setInterval>;
  const stream = new ReadableStream({
    start(controller) {
      let last = '';
      const tick = async () => {
        const m = await getMatchById(id).catch(() => undefined);
        if (!m) return;
        const sig = m.innings.map((i) => `${i.runs}/${i.wickets}/${i.ballsBowled}`).join('|') + m.status;
        if (sig !== last) { last = sig; controller.enqueue(enc.encode(`event: update\ndata: ${JSON.stringify({ sig })}\n\n`)); }
        else controller.enqueue(enc.encode(`: ping\n\n`));
      };
      tick();
      timer = setInterval(tick, 1500);
      req.signal.addEventListener('abort', () => { clearInterval(timer); try { controller.close(); } catch {} });
    },
    cancel() { clearInterval(timer); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } });
}
