# Apex: Discovery Checklist & Delivery Status

Source of discovery: public pages of crex.com (home, series, series detail, team, fixtures, live scores, match page, stats, rankings, news, sitemap, robots) reviewed 17 Nov 2026.

## 1. Legal / ethical position (read first)
- crex.com content, data and branding are proprietary. Its robots.txt disallows `/api/`; its terms are not an open licence.
- **Apex does not scrape, proxy or copy crex.com data, copy, images or branding.** Apex re-creates the *feature set* only, with its own design, name and code.
- Data is served through a `CricketProvider` interface (`packages/core/src/types.ts`). Today a seeded **demo engine** implements it (simulated, labelled demo). For real live data, license a feed (e.g. Sportmonks, CricketData/CricAPI, Roanuz, Entity Sport, Sportradar) and implement the same interface. Check redistribution, caching and attribution terms of whichever vendor you pick.
- Team badges are generated monograms (no logos/flags/photos). Real player photos and team logos need licensed assets.

## 2. Feature inventory (crex.com) and Apex status

| Area | crex.com features observed | Apex status |
|---|---|---|
| Global | Header nav (Home, Series, Teams, Fixtures, Stats Corner, Rankings, News), search, theme + language, live ticker/top-matches dropdown, app download badges, footer legal links | Built, except language switcher + app badges |
| Home | Live/upcoming/completed match cards, featured news tabs, quick links, featured series, rankings preview | Built (live auto-refresh, animated reveals) |
| Live scores `/cricket-live-score` | Live/upcoming/completed cards, status lines | Built |
| Match page | Tabs: Match info, Live, Scorecard, Discussions, Series Stats, News; score banner, CRR, batters/bowler/partnership, win-probability (% or odds), over-by-over, commentary with filters (All, Highlights, Overs, W, 6s, 4s, Innings, Milestone) | Built: Live, Scorecard, Commentary, Squads, Info; win probability, recent overs. Commentary filters (All/Wickets/Sixes/Fours) and partnership added. **Missing:** discussions, odds view |
| Fixtures `/schedule` | Date groups, prev/next, filters (Team, Format, Series type) | Built (Team, Format, Series-type filters). Missing: date paging |
| Series list + detail | Series cards, tabs Overview/Matches/Squads/Series Stats/News, series info | Built, including points table |
| Teams list + detail | Team grid; Overview/Matches/News, About (since, board, bio) | Built (+ Squad tab, rankings) |
| Players | Profile pages (in sitemap `player.xml`) | Profile, rankings, career stats table (demo) |
| Stats Corner | Per-series leaderboards (runs, wickets, SR, 100s, 6s, 4s, 50s), series selector, filters (format, team, year) | Built (7 categories, series selector). Missing: team/format/year filters |
| Rankings | Men/Women × Team/Batter/Bowler/All-rounder × Test/ODI/T20, rank movement arrows, full list | Built for Men. Men and Women (women's pool is demo data) |
| News | Categories (Latest, News, Records, Analysis, Prediction, Reactions, Listicles, Stories, Top), article pages, authors | Built (demo copy). Missing: CMS |
| Legal pages | Terms, Privacy, Community Guidelines, Contest Terms, Refund, Editorial Policy | Terms, Privacy built. Others only if features need them |
| SEO | Multiple sitemaps (news archives, player, rankings, team, live-score, series, stats, social) | Single sitemap (169 URLs), robots, JSON-LD, OG image |
| Not observed / out of scope | Accounts, fantasy/contests, push notifications, odds | Future (note crex has "Contest Terms" and "Refund Policy") |

### Data models (implemented in `packages/core/src/types.ts`)
Team, Player, Series, Match (innings, batting/bowling lines, fall of wickets, commentary, win probability), RankingEntry, StatRow, Article.

### Non-functional targets
- Performance: server-rendered, ~103 to 150 kB first-load JS; target LCP < 2.5s, INP < 200ms, CLS < 0.1 (not yet measured with Lighthouse).
- Accessibility: skip link, landmarks, table captions/scopes, focus rings, `aria-current` tabs, `prefers-reduced-motion` honoured, light/dark themes. Not yet screen-reader or axe tested.
- Animation principles: purposeful (score roll, ball pop-in, win-probability spring, scroll reveal, card lift), under 600 ms, disabled under reduced motion.

## 3. Build status

| Phase | Scope | Status |
|---|---|---|
| 0 | Monorepo, design system, demo data engine | Done |
| 1 | Web MVP (all pages above) | **Done, builds, 22 routes smoke-tested** |
| 2 | Real data provider, DB (Postgres/Neon), caching, websockets/SSE | Next |
| 3 | Women's rankings, points table, commentary filters, player career stats, i18n | Next |
| 4 | Mobile app (Expo/React Native, shares `@apex/core`) | After web is signed off |

## 4. Pre-launch audit (20 points), verified 17 Nov 2026 against the running production build on localhost

Legend: PASS / PARTIAL / FAIL / EXT (needs external verification) / N/A

| # | Requirement | Status | Evidence | Remaining |
|---|---|---|---|---|
| 1 | SSR | PASS | Next.js 15 App Router; pages render HTML on server (curl returns `<h1>`, `<title>`, content). Live pages are `force-dynamic` SSR | none |
| 2 | robots.txt | PASS | `/robots.txt` allows `/`, blocks `/api/` and `/search`, lists sitemap | Set `NEXT_PUBLIC_SITE_URL` (currently localhost) |
| 3 | sitemap.xml | PASS | 169 `<loc>` entries incl. matches, series, teams, players, news; excludes search/api | Same env var. Demo match URLs should be replaced by real ones |
| 4 | Unique titles | PASS | `generateMetadata` on dynamic pages; checked home + match | none |
| 5 | Meta descriptions | PASS | Set on every page via `pageMeta` | none |
| 6 | One H1 | PARTIAL | One `<h1>` on pages checked (home, match, others use `PageTitle`) | Run a crawler across all routes |
| 7 | Canonical | PASS | `<link rel="canonical">` verified on match page | Env var for prod host |
| 8 | Open Graph | PASS | og tags set; per-page dynamic images for match, team and series (200 image/png); generic image elsewhere | Env var for prod host |
| 9 | Custom 404 | PASS | `/nope`, `/team/zzz`, bad match slug return HTTP 404 with branded page | none |
| 10 | 301 redirects | PARTIAL | `/live`, `/fixtures`, `/teams` redirect permanently, but Next emits **308** (equivalent for SEO) | Add legacy-URL map once real old URLs exist |
| 11 | Alt text | N/A | No `<img>`; badges/avatars are decorative `aria-hidden` | Revisit when real photos added |
| 12 | WebP/AVIF | N/A | No raster images yet | Use `next/image` when assets arrive |
| 13 | Lazy loading | N/A | Same | Same |
| 14 | Organization schema | PARTIAL | Organization + WebSite(SearchAction) JSON-LD in layout | Add `sameAs` social profiles, real logo PNG |
| 15 | Breadcrumbs | PASS | Visible breadcrumbs + BreadcrumbList JSON-LD on all multi-level pages | none |
| 16 | Internal links | PARTIAL | Cross-linking verified by hand (nav, cards, tabs, footer); no crawler run | Run a broken-link crawl before launch |
| 17 | Google Analytics | EXT | GA4 loader exists, consent-gated, IP anonymised; **no measurement ID set** | Add `NEXT_PUBLIC_GA_ID`, check DebugView |
| 18 | Search Console | EXT | `GSC_VERIFICATION` env hook renders the meta tag; no access to account | Verify property, submit `/sitemap.xml` |
| 19 | Privacy policy | PARTIAL | Page exists and matches actual behaviour (contact form, consent GA4) | Needs legal review, real company name + contact address |
| 20 | Contact form | PARTIAL | Verified: validation errors (422), success (200), honeypot, rate limit (5/10 min, in-memory). **Delivery not tested**: needs `RESEND_API_KEY` + `CONTACT_TO_EMAIL` | Configure email, add CAPTCHA/Turnstile for production, shared rate-limit store |

## 5. Prioritised next steps
1. Choose and license a live cricket data provider (blocks "real live data").
2. Set production env vars (site URL, GA ID, GSC token, email keys).
3. Add Neon Postgres + cache layer; SSE for live updates (replace 4 to 6 s polling).
4. Lighthouse + axe pass; per-page OG images.
5. Women's rankings, points tables, commentary filters, player career stats.
6. Start the Expo mobile app on `@apex/core`.

## 6. Backend foundation (added)
- `db/schema.sql`: vendor-neutral Postgres schema (teams, players, series, matches, innings, deliveries, scorecard lines, rankings, stat leaders, articles, contact messages). Every row has `source`/`source_id` so vendors can be swapped. **Not applied to any database yet.**
- `packages/core/src/vendor.ts`: `VendorAdapter` contract (live, fixtures, match) and env-based provider selection (`APEX_DATA_PROVIDER=demo|database`).
- `/api/matches/[id]/stream`: Server-Sent Events. The match page refreshes only when the score changes, falling back to polling.
- Still needed once a vendor is chosen: the adapter, an ingestion worker (separate Node service), database + Redis provisioning, and a `database` provider that reads Postgres.

## 7. Sportmonks adapter (added)
- `apps/web/src/lib/sportmonks.ts` maps Sportmonks Cricket API v2.0 fixtures to Apex types: scorecards (batting, bowling, fall of wickets, extras), ball-by-ball commentary, recent overs, toss, venue, lineups. Teams, players and series are discovered from the feed.
- `apps/web/src/lib/data.ts` is the async facade; `APEX_DATA_PROVIDER=demo|sportmonks` selects the source. Demo remains the default.
- In-process cache with TTLs (list 60 s, live match 30 s, finished 1 h) keeps usage inside the free plan's 180 calls/hour. This cache is per server process; with several instances use Redis.
- Points tables use real results and real net run rate.
- **Verified against real data:** 15 fixtures, 75 match-page URLs (all tabs), series, team, player, OG image, 404. **Not verified:** a live in-play match (none was on during testing).
- **Still demo data even in sportmonks mode:** rankings, stats leaders, player career stats, news. Win probability is not provided by the feed, so it is hidden for real matches.
- **Free plan limits:** only 3 leagues (T20I, BBL, CSA T20 Challenge), no IPL or Tests. A paid plan or second vendor is needed for launch.
