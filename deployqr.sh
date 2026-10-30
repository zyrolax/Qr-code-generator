#!/usr/bin/env bash
# One-command deploy: commit + push local changes, then update the live test
# site on the VPS. Run from your laptop in the repo root:
#
#   ./deployqr.sh                 # auto commit message
#   ./deployqr.sh "fix editor"    # custom commit message
#
# First-time setup — tell it how to reach your VPS (put these in your shell
# profile, e.g. ~/.zshrc, so you don't retype them):
#
#   export REQUESTO_SSH=user@requesto.in        # your SSH login
#   export REQUESTO_PATH=/var/www/requesto-test # where you cloned it (optional)
set -euo pipefail

SSH_TARGET="${REQUESTO_SSH:-}"
REMOTE_PATH="${REQUESTO_PATH:-/var/www/requesto-test}"

if [ -z "$SSH_TARGET" ]; then
  echo "❌ Set REQUESTO_SSH first, e.g.:  export REQUESTO_SSH=user@requesto.in"
  exit 1
fi

MSG="${1:-deploy: $(date '+%Y-%m-%d %H:%M')}"

# 1. Commit anything uncommitted, then push.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "==> Committing local changes"
  git add -A
  git commit -m "$MSG"
else
  echo "==> No local changes to commit"
fi

echo "==> Pushing to GitHub"
git push

# 2. Trigger the rebuild + restart on the VPS.
echo "==> Deploying on $SSH_TARGET"
ssh "$SSH_TARGET" "cd '$REMOTE_PATH' && bash deploy/update.sh"

echo "✅ Live: https://test1.requesto.in"
