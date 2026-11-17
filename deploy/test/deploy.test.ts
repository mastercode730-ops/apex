import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

describe('docker-compose.yml', () => {
  const c = parse(read('docker-compose.yml'), { merge: true }); // compose supports YAML merge keys (<<: *anchor)
  const s = c.services;
  it('defines the full stack', () => { expect(Object.keys(s).sort()).toEqual(['caddy', 'migrate', 'postgres', 'web', 'worker']); });
  it('never publishes Postgres to the internet', () => { expect(s.postgres.ports).toBeUndefined(); });
  it('only Caddy exposes ports (80/443)', () => {
    for (const name of ['web', 'worker', 'migrate', 'postgres']) expect(s[name].ports, name).toBeUndefined();
    expect(s.caddy.ports).toEqual(expect.arrayContaining(['80:80', '443:443']));
  });
  it('runs migrations before the app starts and waits for a healthy database', () => {
    expect(s.migrate.depends_on.postgres.condition).toBe('service_healthy');
    expect(s.web.depends_on.migrate.condition).toBe('service_completed_successfully');
    expect(s.worker.depends_on.migrate.condition).toBe('service_completed_successfully');
  });
  it('production web reads from the database; secrets are required, not defaulted', () => {
    expect(s.web.environment.APEX_DATA_PROVIDER).toBe('database');
    expect(s.postgres.environment.POSTGRES_PASSWORD).toContain(':?');
    expect(s.worker.environment.SPORTMONKS_TOKEN).toContain(':?');
    expect(s.web.build.args.NEXT_PUBLIC_SITE_URL).toContain(':?');
  });
  it('restarts services automatically and persists data in named volumes', () => {
    for (const name of ['postgres', 'web', 'worker', 'caddy']) expect(s[name].restart, name).toBe('unless-stopped');
    expect(Object.keys(c.volumes)).toEqual(expect.arrayContaining(['pgdata', 'caddy_data']));
  });
});

describe('deployment files', () => {
  it('every file referenced by compose exists', () => {
    for (const f of ['apps/web/Dockerfile', 'services/worker/Dockerfile', 'deploy/Caddyfile', '.env.production.example', 'deploy/DEPLOY.md', 'deploy/backup.sh', 'deploy/update.sh']) expect(existsSync(join(root, f)), f).toBe(true);
  });
  it('Caddy streams SSE unbuffered and sets HSTS', () => {
    const t = read('deploy/Caddyfile'); expect(t).toContain('flush_interval -1'); expect(t).toContain('Strict-Transport-Security');
  });
  it('.env.production.example documents every variable compose requires', () => {
    const env = read('.env.production.example');
    const referenced = [...read('docker-compose.yml').matchAll(/\$\{([A-Z_]+)[:?-]/g)].map((m) => m[1]);
    for (const v of new Set(referenced)) expect(env, v).toContain(`${v}=`);
  });
  it('never commits real secrets', () => {
    for (const f of ['.env.production.example', 'apps/web/.env.example']) expect(read(f)).not.toMatch(/SPORTMONKS_TOKEN=\S{20,}/);
  });
  it('Dockerfiles use the repo root as build context and non-root users', () => {
    for (const f of ['apps/web/Dockerfile', 'services/worker/Dockerfile']) { const t = read(f); expect(t).toContain('USER node'); expect(t).toContain('HEALTHCHECK'); }
    expect(read('apps/web/Dockerfile')).toContain('apps/web/server.js');
  });
});
