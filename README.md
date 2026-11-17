# Apex

Live cricket platform (web + upcoming mobile app). Monorepo:

```
apps/web         Next.js 15 (App Router) + Tailwind v4 + Framer Motion
packages/core    Shared types, demo data engine, provider interface (reused by the mobile app)
docs/CHECKLIST.md  Feature inventory, build status, 20-point pre-launch audit
```

## Run
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
```
Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in values (site URL, GA4 ID, Search Console token, email keys).

## Data
All data is simulated by a seeded engine (`packages/core`). Live matches advance one ball every 5 seconds. To use real data, implement `CricketProvider` with a licensed feed. See docs/CHECKLIST.md section 1.
