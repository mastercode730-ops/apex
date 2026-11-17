#!/usr/bin/env bash
# Nightly Postgres backup. Run from the repo directory on the VPS (see DEPLOY.md for the cron line).
# Keeps the last 14 dumps in ./backups. Copy that folder off the server too (Hostinger snapshots, rclone to S3/B2, etc.).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose --env-file .env.production exec -T postgres pg_dump -U apex -d apex --no-owner | gzip > "backups/apex-$STAMP.sql.gz"
# Refuse to keep an empty/failed dump
if [ ! -s "backups/apex-$STAMP.sql.gz" ] || [ "$(stat -c%s "backups/apex-$STAMP.sql.gz")" -lt 200 ]; then
  echo "backup looks empty, removing" >&2; rm -f "backups/apex-$STAMP.sql.gz"; exit 1
fi
ls -1t backups/apex-*.sql.gz | tail -n +15 | xargs -r rm --
echo "backup ok: backups/apex-$STAMP.sql.gz"
# Restore:  gunzip -c backups/apex-XXXX.sql.gz | docker compose --env-file .env.production exec -T postgres psql -U apex -d apex
