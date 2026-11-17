# Apex

Live cricket platform: website, public API, data worker and mobile app.

```
apps/web          Next.js website + public API (/api/v1) + newsroom admin
apps/mobile       Expo (React Native) iOS/Android app, uses the same API   (own npm install, see its README)
services/worker   Background service: Sportmonks -> Postgres
packages/core     Shared types, demo data engine, stat/points/ranking logic
packages/db       Postgres access + migrations
packages/sportmonks  Sportmonks Cricket API adapter (mapping, caching, rate-limit awareness)
deploy/           Caddyfile, backup/update scripts, DEPLOY.md (Hostinger VPS guide)
docs/CHECKLIST.md Feature inventory, audit and launch status
```

## Production in one picture
```
visitors / mobile app -> Caddy (HTTPS) -> web -> Postgres <- worker <- Sportmonks API
```
**Deploying:** follow [deploy/DEPLOY.md](deploy/DEPLOY.md). In short: buy the Sportmonks plan, point your domain at the VPS, copy `.env.production.example` to `.env.production`, fill in the token and secrets, run `docker compose --env-file .env.production up -d --build`.

## Develop locally
```bash
npm install
npm run dev                 # website on http://localhost:3000 using built-in demo data (no setup)
npm test                    # unit + integration tests
npm run typecheck           # web + worker
```

### Develop against real data (Sportmonks + a local database, no Docker needed)
```bash
npm run db:dev                                   # terminal 1: local Postgres (PGlite) on :5433
# terminal 2: put SPORTMONKS_TOKEN in apps/web/.env.local, then
set DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres      # PowerShell: $env:DATABASE_URL="..."
npm run worker                                   # keeps the DB in sync (add -- --once for a single pass)
# terminal 3
set APEX_DATA_PROVIDER=database
npm run dev
```
Data modes (`APEX_DATA_PROVIDER`): `demo` (simulated, default) | `sportmonks` (matches straight from the API, dev only) | `database` (production; reads Postgres kept fresh by the worker).

## Public API (used by the mobile app)
`GET /api/v1/matches?status=live`, `/matches/:id`, `/series`, `/series/:id`, `/teams`, `/teams/:id`, `/players/:id`, `/rankings/:gender/:kind?format=`, `/stats/:category?series=`, `/news`, `/news/:slug`. Health: `GET /api/health`.

## Mobile app
See [apps/mobile/README.md](apps/mobile/README.md) (Expo / EAS build and store submission).
