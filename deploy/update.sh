#!/usr/bin/env bash
# Runs ON THE VPS, inside the repo. Pulls the latest code, rebuilds, and
# restarts the API. Safe to run repeatedly.
#
#   cd /var/www/requesto-test && bash deploy/update.sh
set -euo pipefail

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

echo "==> Done. Live at https://test.requesto.in"
