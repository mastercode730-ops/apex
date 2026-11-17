// Local Postgres for development/testing without Docker (PGlite exposed over the Postgres wire protocol).
// Usage: node scripts/dev-db.mjs [port] [dataDir]
//   DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const port = Number(process.argv[2] ?? 5433);
const dir = process.argv[3]; // omit for in-memory
const db = await PGlite.create(dir);
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: Number(process.env.DEV_DB_MAX_CONN ?? 10) });
await server.start();
console.log(`Dev Postgres (PGlite) listening on 127.0.0.1:${port} ${dir ? `data=${dir}` : '(in-memory)'}`);
console.log(`DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
const stop = async () => { await server.stop(); await db.close(); process.exit(0); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
