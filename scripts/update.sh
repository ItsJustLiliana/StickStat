#!/usr/bin/env bash
set -euo pipefail

cd /projects/StickStat
git pull --ff-only
npm ci
npx prisma generate
npx prisma migrate deploy
npm run lint
npm run typecheck
npm run test
npm run build
systemctl --user restart stickstat.service
systemctl --user --no-pager status stickstat.service
