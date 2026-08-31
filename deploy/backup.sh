#!/usr/bin/env bash
set -euo pipefail

umask 077
project_dir="${STICKSTAT_DIR:-/projects/StickStat}"
backup_root="${STICKSTAT_BACKUP_DIR:-/projects/StickStat-backups}"
retention_days="${STICKSTAT_BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
pending_dir="${backup_root}/.${timestamp}.pending"
final_dir="${backup_root}/${timestamp}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required for StickStat backups." >&2
  exit 1
fi
if ! [[ "${retention_days}" =~ ^[0-9]+$ ]]; then
  echo "STICKSTAT_BACKUP_RETENTION_DAYS must be a number." >&2
  exit 1
fi

mkdir -p "${backup_root}"
mkdir "${pending_dir}"
cleanup(){ rm -rf -- "${pending_dir}"; }
trap cleanup EXIT

/usr/bin/pg_dump --format=custom --no-owner --no-privileges --file="${pending_dir}/database.dump" "${DATABASE_URL}"
/usr/bin/tar -czf "${pending_dir}/uploads.tar.gz" -C "${project_dir}/public" uploads
(
  cd "${pending_dir}"
  /usr/bin/sha256sum database.dump uploads.tar.gz > SHA256SUMS
)
/usr/bin/mv "${pending_dir}" "${final_dir}"
trap - EXIT

while IFS= read -r -d '' expired; do
  rm -rf -- "${expired}"
done < <(/usr/bin/find "${backup_root}" -mindepth 1 -maxdepth 1 -type d -name '20*' -mtime "+${retention_days}" -print0)

echo "StickStat backup created at ${final_dir}."
