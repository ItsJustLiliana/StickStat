#!/usr/bin/env bash
set -euo pipefail

project_dir="${STICKSTAT_DIR:-/projects/StickStat}"
lock_file="${XDG_RUNTIME_DIR:-/tmp}/stickstat-auto-update.lock"

if [[ ! -d "${project_dir}/.git" ]]; then
  echo "StickStat checkout not found at ${project_dir}." >&2
  exit 1
fi

exec 9>"${lock_file}"
if ! flock -n 9; then
  echo "A StickStat deployment is already running."
  exit 0
fi

user_id="$(id -u)"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/${user_id}}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR}/bus}"

if [[ -n "$(git -C "${project_dir}" status --porcelain --untracked-files=no)" ]]; then
  echo "StickStat contains tracked changes; refusing automatic deployment." >&2
  exit 1
fi

git -C "${project_dir}" fetch --prune origin main
previous_commit="$(git -C "${project_dir}" rev-parse HEAD)"
target_commit="$(git -C "${project_dir}" rev-parse origin/main)"

git -C "${project_dir}" checkout main
git -C "${project_dir}" merge --ff-only origin/main

npm --prefix "${project_dir}" ci
npm --prefix "${project_dir}" run prisma:generate
npm --prefix "${project_dir}" run lint
npm --prefix "${project_dir}" run typecheck
npm --prefix "${project_dir}" run test
npm --prefix "${project_dir}" run build
npm --prefix "${project_dir}" run prisma:deploy

systemctl --user restart stickstat.service
systemctl --user is-active --quiet stickstat.service

echo "StickStat deployed from ${previous_commit:0:7} to ${target_commit:0:7}."
