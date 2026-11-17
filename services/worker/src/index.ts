import { createServer } from 'node:http';
import { getApiStats } from '@apex/sportmonks';
import { closePool, migrate, setState } from '@apex/db';
import { backfillDetails, syncCareers, syncFixtures, syncLive, syncRankings } from './sync';

const sec = (name: string, d: number) => Number(process.env[name] ?? d) * 1000;
const log = (...a: unknown[]) => console.log(new Date().toISOString(), ...a);

if (!process.env.SPORTMONKS_TOKEN) { console.error('SPORTMONKS_TOKEN is required'); process.exit(1); }
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required'); process.exit(1); }

type Status = { lastOk?: string; lastError?: string; lastResult?: unknown; runs: number; failures: number };
const tasks: Record<string, Status> = {};

/** Runs fn forever on an interval; never overlaps itself; backs off on repeated failure. */
function schedule(name: string, everyMs: number, fn: () => Promise<unknown>) {
  const st: Status = (tasks[name] = { runs: 0, failures: 0 });
  let running = false, stopped = false, fails = 0;
  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      st.lastResult = await fn(); st.lastOk = new Date().toISOString(); st.lastError = undefined; fails = 0; st.runs++;
      log(name, JSON.stringify(st.lastResult));
    } catch (e) { fails++; st.failures++; st.lastError = (e as Error).message; log(name, 'FAILED:', st.lastError); }
    finally { running = false; if (!stopped) setTimeout(tick, everyMs * Math.min(2 ** fails, 8)); }
  };
  setTimeout(tick, 0);
  return () => { stopped = true; };
}

async function main() {
  const applied = await migrate();
  if (applied.length) log('migrations applied:', applied.join(', '));

  if (process.argv.includes('--once')) {
    log('fixtures', JSON.stringify(await syncFixtures()));
    log('live', JSON.stringify(await syncLive()));
    log('backfill', JSON.stringify(await backfillDetails(Number(process.env.BACKFILL_BATCH ?? 12))));
    log('rankings', JSON.stringify(await syncRankings(true)));
    log('careers', JSON.stringify(await syncCareers()));
    log('api', JSON.stringify(getApiStats()));
    await closePool();
    return;
  }

  const stops = [
    schedule('fixtures', sec('SYNC_FIXTURES_SECONDS', 120), syncFixtures),
    schedule('live', sec('SYNC_LIVE_SECONDS', 20), syncLive),
    schedule('backfill', sec('SYNC_BACKFILL_SECONDS', 60), backfillDetails),
    schedule('rankings', sec('SYNC_RANKINGS_SECONDS', 3600), () => syncRankings()),
    schedule('careers', sec('SYNC_CAREERS_SECONDS', 300), syncCareers),
    schedule('heartbeat', 60_000, async () => { await setState('worker', { at: new Date().toISOString(), tasks, api: getApiStats() }); return 'ok'; }),
  ];

  // Health endpoint: 200 while fixtures sync is fresh (10 min grace after start), else 503.
  const started = Date.now();
  const server = createServer((req, res) => {
    if (req.url !== '/health') { res.writeHead(404).end(); return; }
    const f = tasks.fixtures?.lastOk ? Date.now() - new Date(tasks.fixtures.lastOk).getTime() : undefined;
    const healthy = f !== undefined ? f < 10 * 60_000 : Date.now() - started < 10 * 60_000;
    res.writeHead(healthy ? 200 : 503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: healthy, uptime: Math.round((Date.now() - started) / 1000), tasks, api: getApiStats() }));
  }).listen(Number(process.env.WORKER_PORT ?? 4000), () => log('worker health on :' + (process.env.WORKER_PORT ?? 4000)));

  const shutdown = async (sig: string) => { log('shutting down on', sig); stops.forEach((s) => s()); server.close(); await closePool().catch(() => {}); process.exit(0); };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((e) => { console.error(e); process.exit(1); });
