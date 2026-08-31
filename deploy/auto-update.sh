#!/usr/bin/env bash
set -euo pipefail

project_dir="${STICKSTAT_DIR:-/projects/StickStat}"
lock_file="${XDG_RUNTIME_DIR:-/tmp}/stickstat-auto-update.lock"
state_dir="${XDG_STATE_HOME:-${HOME}/.local/state}/stickstat"
deployed_commit_file="${state_dir}/deployed-commit"

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
baseline_commit="${previous_commit}"
force_full_deploy=false

if [[ -f "${deployed_commit_file}" ]]; then
  recorded_commit="$(<"${deployed_commit_file}")"
  if git -C "${project_dir}" cat-file -e "${recorded_commit}^{commit}" 2>/dev/null \
    && git -C "${project_dir}" merge-base --is-ancestor "${recorded_commit}" "${target_commit}"; then
    baseline_commit="${recorded_commit}"
  else
    force_full_deploy=true
  fi
elif [[ "${previous_commit}" == "${target_commit}" ]]; then
  force_full_deploy=true
fi

changed_files="$(git -C "${project_dir}" diff --name-only "${baseline_commit}" "${target_commit}")"

git -C "${project_dir}" checkout main
git -C "${project_dir}" merge --ff-only origin/main

app_changed=false
service_changed=false
if grep -Eq '^(app/|components/|generated/|lib/|providers/|public/|services/|prisma/|instrumentation\.ts$|proxy\.ts$|next\.config\.ts$|package(-lock)?\.json$|postcss\.config\.mjs$|tsconfig\.json$)' <<<"${changed_files}"; then
  app_changed=true
fi
if grep -Eq '^(deploy/(stickstat\.service|stickstat-backup\.service|stickstat-backup\.timer|backup\.sh)$)' <<<"${changed_files}"; then
  service_changed=true
fi
if [[ "${force_full_deploy}" == "true" ]]; then
  app_changed=true
fi

if [[ "${app_changed}" == "true" ]]; then
  if [[ ! -x "${project_dir}/node_modules/.bin/next" ]] || grep -Eq '^package(-lock)?\.json$' <<<"${changed_files}"; then
    npm --prefix "${project_dir}" ci
  else
    echo "Dependencies unchanged; keeping existing node_modules."
  fi

  if grep -Eq '^(prisma/schema\.prisma$|prisma\.config\.ts$|package(-lock)?\.json$)' <<<"${changed_files}"; then
    npm --prefix "${project_dir}" run prisma:generate
  fi

  npm --prefix "${project_dir}" run test
  npm --prefix "${project_dir}" run build

  if grep -Eq '^(prisma/migrations/|prisma/schema\.prisma$|prisma\.config\.ts$)' <<<"${changed_files}"; then
    npm --prefix "${project_dir}" run prisma:deploy
  else
    echo "Database schema unchanged; skipping migration check."
  fi
else
  echo "No production application files changed; skipping tests and build."
fi

service_dir="${HOME}/.config/systemd/user"
mkdir -p "${service_dir}"
mkdir -p /projects/StickStat-backups
for unit in stickstat.service stickstat-backup.service stickstat-backup.timer; do
  if [[ "${service_changed}" == "true" ]] || ! cmp -s "${project_dir}/deploy/${unit}" "${service_dir}/${unit}"; then
    cp "${project_dir}/deploy/${unit}" "${service_dir}/${unit}"
    service_changed=true
  fi
done
if [[ "${service_changed}" == "true" ]]; then
  systemctl --user daemon-reload
fi
systemctl --user enable --now stickstat-backup.timer

if [[ "${app_changed}" == "true" || "${service_changed}" == "true" ]]; then
  systemctl --user restart stickstat.service
  systemctl --user is-active --quiet stickstat.service
else
  echo "A service restart is not required."
fi
if [[ "${service_changed}" == "true" ]]; then
  systemctl --user restart stickstat-backup.timer
fi

mkdir -p "${state_dir}"
printf '%s\n' "${target_commit}" >"${deployed_commit_file}"
echo "StickStat deployed from ${previous_commit:0:7} to ${target_commit:0:7}."
