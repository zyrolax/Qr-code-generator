#!/usr/bin/env bash
# Runs ON THE VPS, inside the repo. Pulls the latest code, rebuilds, and
# restarts the API. Safe to run repeatedly.
#
#   cd /var/www/requesto-test && bash deploy/update.sh
set -euo pipefail

# Non-interactive SSH sessions don't load nvm, so node/npm/pm2 may be missing
# from PATH. Source nvm if it's installed so all three resolve consistently.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

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
