#!/usr/bin/env bash
# Deliberately manual: never called by auto-update.sh.
set -euo pipefail
umask 077

image=/projects/StickStat-storage.luks
mapper=stickstat-data
mount_dir=/srv/stickstat-secure
project=/projects/StickStat
originals=/projects/StickStat-migration-originals
app_user=marijn
app_uid=1000
mode="${1:-check}"

fail(){ echo "$*" >&2; exit 1; }
[[ $EUID -eq 0 ]] || fail 'Run this script with sudo on the StickStat server.'
exec 9>/run/lock/stickstat-encrypted-storage.lock
flock -n 9 || fail 'Storage maintenance is already running.'
user_service(){ runuser -u "$app_user" -- env XDG_RUNTIME_DIR="/run/user/$app_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$app_uid/bus" systemctl --user "$@"; }
verify_mount(){
  mountpoint -q "$mount_dir" || fail 'Encrypted storage is not mounted.'
  [[ "$(findmnt -n -o SOURCE --target "$mount_dir")" == "/dev/mapper/$mapper" ]] || fail 'Unexpected mount source.'
  cryptsetup status "$mapper" >/dev/null || fail 'Encrypted mapper is not active.'
}

case "$mode" in
  check)
    findmnt -T "$project" -o TARGET,SOURCE,FSTYPE
    lsblk -o NAME,TYPE,FSTYPE,MOUNTPOINTS
    runuser -u postgres -- psql -Atc 'SHOW data_directory'
    runuser -u postgres -- psql -Atc 'SELECT datname FROM pg_database WHERE NOT datistemplate'
    du -sh /var/lib/postgres/data "$project/public/uploads"
    df -h /projects
    exit 0
    ;;
  unlock)
    [[ -f "$image" && ! -L "$image" ]] || fail 'Storage image is missing.'
    if ! cryptsetup status "$mapper" >/dev/null 2>&1; then
      cryptsetup open "$image" "$mapper"
    fi
    mountpoint -q "$mount_dir" || mount -o nodev,nosuid "/dev/mapper/$mapper" "$mount_dir"
    verify_mount
    systemctl start postgresql.service
    user_service restart stickstat.service
    user_service start stickstat-backup.timer
    echo 'Encrypted storage unlocked; StickStat started.'
    exit 0
    ;;
  migrate) ;;
  *) fail 'Usage: encrypted-storage.sh check|migrate|unlock' ;;
esac

[[ "${2:-}" == --verified-backup ]] || fail 'First restore-test an encrypted backup, then pass --verified-backup.'
[[ "$(id -u "$app_user")" == "$app_uid" ]] || fail 'Unexpected app user.'
for tool in cryptsetup mkfs.ext4 fallocate rsync psql runuser mountpoint; do command -v "$tool" >/dev/null; done
[[ ! -e "$image" && ! -L "$image" ]] || fail 'Image already exists; refusing to overwrite it.'
[[ ! -e "$mount_dir" && ! -L "$mount_dir" ]] || fail 'Mount directory already exists; inspect it manually.'
[[ -d /var/lib/postgres/data && ! -L /var/lib/postgres/data ]] || fail 'Unexpected PostgreSQL data path.'
[[ -d "$project/public/uploads" && ! -L "$project/public/uploads" ]] || fail 'Unexpected uploads path.'
[[ -f "$project/.env" && ! -L "$project/.env" ]] || fail 'Unexpected environment file.'
[[ ! -e "$originals" && ! -L "$originals" ]] || fail 'An earlier migration needs attention.'
[[ ! -e /etc/systemd/system/postgresql.service.d/stickstat-encryption.conf ]] || fail 'PostgreSQL override already exists.'
[[ "$(runuser -u postgres -- psql -Atc 'SHOW data_directory')" == /var/lib/postgres/data ]] || fail 'Unexpected running PostgreSQL cluster.'
other_databases="$(runuser -u postgres -- psql -Atc "SELECT datname FROM pg_database WHERE NOT datistemplate AND datname NOT IN ('postgres','stickstat')")"
[[ -z "$other_databases" ]] || fail 'PostgreSQL serves other applications; use a separate cluster instead.'
[[ "$(runuser -u postgres -- psql -d postgres -Atc "SELECT count(*) FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p')")" == 0 ]] || fail 'The postgres database contains application tables.'
[[ "$(runuser -u postgres -- psql -Atc "SELECT count(*) FROM pg_tablespace WHERE pg_tablespace_location(oid) <> ''")" == 0 ]] || fail 'External tablespaces need a separate migration.'
[[ -z "$(find /var/lib/postgres/data -type l -print -quit)" ]] || fail 'Cluster contains external links, possibly WAL; migrate those explicitly.'
[[ -z "$(find "$project/public/uploads" -type l -print -quit)" ]] || fail 'Uploads contain external links.'
needed="$(du -sb /var/lib/postgres/data "$project/public/uploads" | awk '{n+=$1} END {print n}')"
[[ "$needed" -lt 4294967296 ]] || fail 'Dataset exceeds this 10 GiB volume plan; resize the plan first.'
available="$(df -B1 --output=avail /projects | tail -1 | tr -d ' ')"
[[ "$available" -gt 12884901888 ]] || fail 'At least 12 GiB free space is required.'

# Only a newly created regular file is formatted, never a physical disk.
(set -o noclobber; : > "$image")
fallocate -l 10G "$image"
cryptsetup luksFormat --type luks2 "$image"
cryptsetup open "$image" "$mapper"
mkfs.ext4 "/dev/mapper/$mapper"
install -d -m 755 "$mount_dir"
mount -o nodev,nosuid "/dev/mapper/$mapper" "$mount_dir"
verify_mount
install -d -m 700 -o postgres -g postgres "$mount_dir/postgres"
install -d -m 700 -o "$app_user" -g "$app_user" "$mount_dir/app"
install -d -m 700 "$originals"

# Stop writers before copying. On failure leave them stopped for inspection.
user_service stop stickstat-backup.timer stickstat-backup.service stickstat.service
systemctl stop postgresql.service
trap 'echo "Migration stopped. Do not delete either copy. Inspect the error and follow docs/DATA_ENCRYPTION.md before restarting." >&2' ERR
rsync -aHAX /var/lib/postgres/data/ "$mount_dir/postgres/data/"
rsync -aHAX "$project/public/uploads/" "$mount_dir/app/uploads/"
cp -a "$project/.env" "$mount_dir/app/.env"
[[ -z "$(rsync -aHAXnc --out-format='%n' /var/lib/postgres/data/ "$mount_dir/postgres/data/")" ]] || fail 'Database copy verification failed.'
[[ -z "$(rsync -aHAXnc --out-format='%n' "$project/public/uploads/" "$mount_dir/app/uploads/")" ]] || fail 'Uploads copy verification failed.'
cmp "$project/.env" "$mount_dir/app/.env"

install -d /etc/systemd/system/postgresql.service.d
cat > /etc/systemd/system/postgresql.service.d/stickstat-encryption.conf <<'UNIT'
[Unit]
ConditionPathIsMountPoint=/srv/stickstat-secure

[Service]
Environment=PGROOT=/srv/stickstat-secure/postgres
PIDFile=/srv/stickstat-secure/postgres/data/postmaster.pid
UNIT

mv "$project/public/uploads" "$originals/uploads"
ln -s "$mount_dir/app/uploads" "$project/public/uploads"
mv "$project/.env" "$originals/environment"
ln -s "$mount_dir/app/.env" "$project/.env"
override_dir=/home/marijn/.config/systemd/user/stickstat.service.d
install -d -o "$app_user" -g "$app_user" "$override_dir"
cat > "$override_dir/encrypted-storage.conf" <<'UNIT'
[Service]
ExecStartPre=/usr/bin/mountpoint -q /srv/stickstat-secure
UNIT
chown "$app_user:$app_user" "$override_dir/encrypted-storage.conf"
systemctl daemon-reload
user_service daemon-reload
systemctl start postgresql.service
[[ "$(runuser -u postgres -- psql -Atc 'SHOW data_directory')" == "$mount_dir/postgres/data" ]] || fail 'PostgreSQL did not switch storage.'
user_service start stickstat.service stickstat-backup.timer
user_service is-active --quiet stickstat.service
echo 'Active database, uploads and .env now use LUKS2 storage.'
echo 'Original plaintext copies remain for rollback. Complete verification and the cleanup procedure in docs/DATA_ENCRYPTION.md.'
echo 'After reboot: sudo bash /projects/StickStat/deploy/encrypted-storage.sh unlock'
