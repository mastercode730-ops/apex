#!/usr/bin/env bash
# Pull the latest code and redeploy with minimal downtime. Run on the VPS from the repo directory.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env.production ] || { echo ".env.production is missing (copy .env.production.example)" >&2; exit 1; }
git pull --ff-only
docker compose --env-file .env.production up -d --build --remove-orphans
docker image prune -f >/dev/null
echo "waiting for the site to report healthy..."
for i in $(seq 1 30); do
  if docker compose --env-file .env.production exec -T web wget -qO- "http://127.0.0.1:3000/api/health?probe=live" >/dev/null 2>&1; then echo "web is up"; break; fi
  sleep 2
done
docker compose --env-file .env.production ps
