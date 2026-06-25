#!/usr/bin/env bash
set -euo pipefail
REPO_DIR="/home/ubuntu/Hackahoy"
BRANCH="main"
cd "$REPO_DIR"
echo "==> [1/5] pull ($BRANCH)"
git fetch --prune origin
git reset --hard "origin/${BRANCH}"
echo "==> [2/5] backend build"
npm ci
npm run build
echo "==> [3/5] ai-tutor deps"
if [ -f ai-tutor/requirements.txt ]; then
  python3 -m venv ai-tutor/venv
  ai-tutor/venv/bin/pip install --upgrade pip --quiet
  ai-tutor/venv/bin/pip install -r ai-tutor/requirements.txt --quiet
fi
echo "==> [4/5] pm2 reload"
pm2 startOrReload deploy/ecosystem.config.js --update-env
pm2 save
echo "==> [5/5] openresty"
docker compose up -d --build openresty
echo "==> done: $(git rev-parse --short HEAD)"
