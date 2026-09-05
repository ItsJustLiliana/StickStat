#!/usr/bin/env bash
set -euo pipefail

umask 077
project_dir="${STICKSTAT_DIR:-/projects/StickStat}"
backup_root="${STICKSTAT_BACKUP_DIR:-/projects/StickStat-backups}"
retention_days="${STICKSTAT_BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
public_key="${STICKSTAT_BACKUP_PUBLIC_KEY:-${HOME}/.config/stickstat/backup-public.asc}"
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
if [[ ! -s "${public_key}" ]]; then
  echo "A backup encryption public key is required; refusing a plaintext backup." >&2
  exit 1
fi
command -v gpg >/dev/null

mkdir -p "${backup_root}"
# Serialize manual runs and timer runs, and never overwrite a completed backup.
exec 9>"${backup_root}/.backup.lock"
flock -n 9 || exit 0
[[ ! -e "${pending_dir}" && ! -e "${final_dir}" ]] || exit 1
mkdir "${pending_dir}"
cleanup(){ rm -rf -- "${pending_dir}"; }
trap cleanup EXIT

# Stream into encryption: no unencrypted dump or tar archive is written to disk.
/usr/bin/pg_dump --format=custom --no-owner --no-privileges "${DATABASE_URL}" |
  gpg --batch --no-options --trust-model always --cipher-algo AES256 --recipient-file "${public_key}" --encrypt --output "${pending_dir}/database.dump.gpg"
/usr/bin/tar -hczf - -C "${project_dir}/public" uploads |
  gpg --batch --no-options --trust-model always --cipher-algo AES256 --recipient-file "${public_key}" --encrypt --output "${pending_dir}/uploads.tar.gz.gpg"
(
  cd "${pending_dir}"
  /usr/bin/sha256sum database.dump.gpg uploads.tar.gz.gpg > SHA256SUMS
)
/usr/bin/mv "${pending_dir}" "${final_dir}"
trap - EXIT

while IFS= read -r -d '' expired; do
  rm -rf -- "${expired}"
done < <(/usr/bin/find "${backup_root}" -mindepth 1 -maxdepth 1 -type d -name '20*' -mtime "+${retention_days}" -print0)

echo "StickStat backup created at ${final_dir}."
