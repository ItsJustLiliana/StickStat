#!/usr/bin/env bash
set -euo pipefail
# Linux integration test. Only disposable fixtures, never the real database.
project_root="${1:-$(pwd)}"
test_root="$(mktemp -d)"
trap 'gpgconf --homedir "$test_root/keys" --kill all 2>/dev/null || true; rm -rf -- "$test_root"' EXIT
chmod 700 "$test_root"
mkdir -m 700 "$test_root/keys" "$test_root/bin" "$test_root/project" "$test_root/photo-data"
mkdir "$test_root/project/public"
ln -s "$test_root/photo-data" "$test_root/project/public/uploads"
printf 'test photo bytes\n' > "$test_root/photo-data/photo.jpg"
gpg --homedir "$test_root/keys" --batch --pinentry-mode loopback --passphrase '' --quick-generate-key 'Disposable StickStat test' rsa2048 encrypt 0 >/dev/null 2>&1
gpg --homedir "$test_root/keys" --armor --export > "$test_root/public.asc"
cat > "$test_root/bin/pg_dump" <<'STUB'
#!/usr/bin/env bash
printf 'sensitive database fixture\n'
exit "${DUMP_EXIT:-0}"
STUB
chmod 700 "$test_root/bin/pg_dump"
sed "s|/usr/bin/pg_dump|$test_root/bin/pg_dump|g" "$project_root/deploy/backup.sh" > "$test_root/backup.sh"
export DATABASE_URL=postgresql://fixture STICKSTAT_DIR="$test_root/project"
export STICKSTAT_BACKUP_PUBLIC_KEY="$test_root/public.asc" GNUPGHOME="$test_root/keys"
export STICKSTAT_BACKUP_DIR="$test_root/backups"
bash "$test_root/backup.sh"
backup="$(find "$STICKSTAT_BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' -print)"
[[ -n "$backup" ]]
(cd "$backup"; sha256sum -c SHA256SUMS)
[[ ! -e "$backup/database.dump" && ! -e "$backup/uploads.tar.gz" ]]
gpg --batch --decrypt "$backup/database.dump.gpg" > "$test_root/restored.dump"
printf 'sensitive database fixture\n' | cmp - "$test_root/restored.dump"
gpg --batch --decrypt "$backup/uploads.tar.gz.gpg" | tar -xzOf - uploads/photo.jpg | cmp - "$test_root/photo-data/photo.jpg"
cp "$backup/database.dump.gpg" "$test_root/corrupt.gpg"
printf 'invalid header' | dd of="$test_root/corrupt.gpg" conv=notrunc status=none
if gpg --batch --decrypt "$test_root/corrupt.gpg" >/dev/null 2>&1; then echo 'Corrupt backup accepted' >&2; exit 1; fi
export STICKSTAT_BACKUP_DIR="$test_root/missing-key"
if STICKSTAT_BACKUP_PUBLIC_KEY="$test_root/missing.asc" bash "$test_root/backup.sh"; then exit 1; fi
[[ ! -e "$STICKSTAT_BACKUP_DIR" ]]
export STICKSTAT_BACKUP_DIR="$test_root/failed-dump"
if DUMP_EXIT=1 bash "$test_root/backup.sh"; then exit 1; fi
[[ -z "$(find "$STICKSTAT_BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -print)" ]]
echo 'PASS: encryption, decryption, symlink uploads, checksums, corruption, missing key and failed dump.'
