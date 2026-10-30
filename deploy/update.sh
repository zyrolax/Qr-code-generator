#!/usr/bin/env bash
# Runs ON THE VPS, inside the repo. Pulls the latest code, rebuilds, and
# restarts the API. Safe to run repeatedly.
#
#   cd /var/www/requesto-test && bash deploy/update.sh
set -euo pipefail

# Non-interactive SSH sessions don't load nvm, so pm2 (installed under nvm's
# Node) isn't on PATH. Find the nvm bin dir that actually contains pm2 and put
# it first on PATH so node/npm/pm2 all resolve consistently.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
PM2_PATH="$(ls "$NVM_DIR"/versions/node/*/bin/pm2 2>/dev/null | sort -V | tail -n1 || true)"
[ -n "$PM2_PATH" ] && export PATH="$(dirname "$PM2_PATH"):$PATH"

# Move to the repo root (this script lives in deploy/).
cd "$(dirname "$0")/.."

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Installing backend deps"
( cd server && npm install --omit=dev )

echo "==> Building frontend"
( cd client && npm install && npm run build )

echo "==> Restarting API (PM2)"
pm2 restart requesto-test-api

echo "==> Done. Live at https://test1.requesto.in"
