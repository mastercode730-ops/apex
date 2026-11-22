# Deploying Apex on a Hostinger VPS

One VPS runs everything in Docker: **Postgres** (data), **worker** (pulls live data from Sportmonks), **web** (website + API), **Caddy** (HTTPS). The mobile app is built separately with Expo (see `apps/mobile/README.md`) and talks to this server's API.

```
Visitors / mobile app ─► Caddy (HTTPS) ─► web ─► Postgres ◄─ worker ◄─ Sportmonks API
```

## 0. Before you start (accounts and decisions)

| Need | Where | Notes |
|---|---|---|
| Sportmonks **paid** cricket plan | my.sportmonks.com | Start the 14-day trial of the plan covering the leagues you want. Copy the token (Settings > Tokens). Ask sales in writing whether public commercial display is allowed. |
| A domain name | any registrar | You will point it at the VPS. |
| (Optional) Resend account | resend.com | Contact-form emails. Needs a verified sending domain. |
| (Optional) Cloudflare Turnstile | dash.cloudflare.com | Free CAPTCHA for the contact form. |
| (Optional) GA4 + Search Console | Google | Measurement ID and a verification token. |

**VPS size:** 2 vCPU / 8 GB RAM (Hostinger "KVM 2") is comfortable for launch. 1 vCPU / 4 GB works for testing.

## 1. Prepare the server (once)

Create the VPS in hPanel with **Ubuntu 24.04**. Then, over SSH as root (or your sudo user):

```bash
# updates + firewall (only SSH, HTTP, HTTPS are open; Postgres is never exposed)
apt update && apt upgrade -y
apt install -y ufw git
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp
ufw --force enable

# Docker (official installer)
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

Optional hardening: create a non-root sudo user, add your SSH key, and disable password login.

## 2. Point your domain at the server

At your DNS provider create **A records** for `@` (your root domain) and `www` pointing to the VPS IP address (shown in hPanel).
If you use Cloudflare, set the records to **DNS only** (grey cloud) until HTTPS works, then you may turn the proxy on (set SSL mode to **Full (strict)**).

## 3. Get the code and configure

```bash
cd /opt
git clone https://github.com/mastercode730-ops/apex.git
cd apex
cp .env.production.example .env.production
nano .env.production
```

Fill at least: `SITE_DOMAIN`, `NEXT_PUBLIC_SITE_URL` (with `https://`), `POSTGRES_PASSWORD` (long random: `openssl rand -hex 24`), `SPORTMONKS_TOKEN`, `ADMIN_USERNAME` and `ADMIN_PASSWORD` (your own strong password) if you want the newsroom admin.
`.env.production` holds secrets: it is git-ignored. Never commit it.

> `NEXT_PUBLIC_*` values (site URL, GA ID, Turnstile site key, store links) are baked into the website at build time. If you change one, rebuild: `docker compose --env-file .env.production up -d --build web`.

## 4. Launch

```bash
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps          # all services Up / healthy; migrate shows "Exited (0)"
docker compose --env-file .env.production logs -f worker
```

The first build takes a few minutes. In the worker log you should see `fixtures {...}`, `backfill {...}` and `rankings {...}` lines within a minute or two.
Caddy fetches the HTTPS certificate automatically (needs DNS from step 2 to have propagated).

## 5. Verify

```bash
curl -s https://YOUR-DOMAIN/api/health            # {"ok":true,"mode":"database","db":"up",...}
curl -s https://YOUR-DOMAIN/api/v1/matches?status=live | head -c 300
```

Open the site and check: home, a match page (all tabs), Series > points table, Rankings, Stats.
`/api/health` returns **503** if the database is down or the worker has not reported for 5 minutes. Point an uptime monitor (UptimeRobot, Better Stack) at it.

## 6. After launch checklist

1. **Search Console:** add the property, put the token in `GSC_VERIFICATION`, redeploy, verify, submit `https://YOUR-DOMAIN/sitemap.xml`.
2. **GA4:** put the measurement ID in `NEXT_PUBLIC_GA_ID`, rebuild web, test in GA Realtime (accept the cookie banner first).
3. **Contact form:** set Resend + `CONTACT_TO_EMAIL`, send a test message at `/contact`. Messages are also saved in the `contact_messages` table.
4. **Newsroom:** open `/admin`, sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`, publish your first stories (the site shows no demo news in production).
5. **Backups:** add a nightly cron (below) and enable Hostinger snapshots.
6. **Legal:** have the privacy policy and terms reviewed, and add your real company name and contact details.

### Nightly backup

```bash
crontab -e
# every night at 03:15
15 3 * * * /opt/apex/deploy/backup.sh >> /var/log/apex-backup.log 2>&1
```
Copy `/opt/apex/backups` off the server regularly (rclone to S3/Backblaze, or download). Restore instructions are at the bottom of `deploy/backup.sh`.

## 7. Updating the site

```bash
cd /opt/apex && ./deploy/update.sh
```
Or use GitHub Actions: add repository secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, then Actions > "Deploy to VPS" > Run workflow.
Database migrations run automatically (`migrate` service) before the new version starts.

## 8. Switching from the Sportmonks trial/free plan to a paid plan

Nothing changes in the code. Replace `SPORTMONKS_TOKEN` in `.env.production` if the token differs, then:
```bash
docker compose --env-file .env.production up -d worker
```
On a paid plan you can shorten `SYNC_LIVE_SECONDS` (default 10). Watch the worker's `api` line for remaining quota: `docker compose --env-file .env.production logs worker | grep remaining`.

## Troubleshooting

| Symptom | Check |
|---|---|
| Site shows no matches | `docker compose logs worker`: look for `FAILED` lines (bad token = 401, quota = 429). |
| HTTPS certificate error | DNS not pointing at the VPS yet, or ports 80/443 blocked. `docker compose logs caddy`. |
| Live scores update slowly | The worker log shows how often `live` runs. Free plan limits to 180 calls/hour. |
| `/api/health` 503 with `workerStale` | Worker is down or failing: `docker compose ps`, `docker compose logs worker`. |
| Out of disk | `docker system df`, `docker image prune -a`, rotate old `backups/`. |
| Changed `NEXT_PUBLIC_*` but nothing changed | Rebuild web: `up -d --build web`. |

## Operating limits to be aware of
- One VPS = one point of failure. Snapshots + nightly dumps are your safety net.
- The web app keeps a short in-memory cache per process, so run **one** web container. To scale out, add a shared cache (Redis) first.
- Player rankings (batter/bowler/all-rounder) are not provided by Sportmonks; the site shows team rankings only. Individual rankings need another data source.
