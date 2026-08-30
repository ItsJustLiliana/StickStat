# StickStat op Arch Linux

Deze procedure raakt `/projects/Flummi`, Flummi-services en poort 3789 niet.

## 1. Voorcontrole

```bash
node --version
npm --version
which node
which npm
ss -ltnp
```

Gebruik de bestaande Node-installatie wanneer die minimaal 20.9 is. Upgrade Node niet blind, omdat Flummi dezelfde systeemruntime kan gebruiken. Poort 4000 moet vrij zijn; kies anders een vrije StickStat-poort, nooit 3789.

## 2. PostgreSQL

Controleer eerst `pacman -Q postgresql`. Alleen als het ontbreekt:

```bash
sudo pacman -S postgresql
sudo -iu postgres initdb -D /var/lib/postgres/data --encoding=UTF8 --locale=C.UTF-8
sudo systemctl enable --now postgresql
systemctl status postgresql
```

Voer `initdb` alleen uit als `/var/lib/postgres/data` nog geen cluster bevat. Maak daarna een sterk wachtwoord en database:

```bash
sudo -iu postgres psql
CREATE ROLE stickstat LOGIN PASSWORD 'EEN_LANG_UNIEK_WACHTWOORD';
CREATE DATABASE stickstat OWNER stickstat;
\q
```

Controleer in `/var/lib/postgres/data/postgresql.conf`:

```conf
listen_addresses = 'localhost'
```

Herstart na een wijziging en controleer dat 5432 niet op `0.0.0.0` of `[::]` staat:

```bash
sudo systemctl restart postgresql
ss -ltnp | grep 5432
```

## 3. Project en configuratie

```bash
sudo mkdir -p /projects/StickStat
sudo chown -R "$USER:$USER" /projects/StickStat
git clone YOUR_REPOSITORY_URL /projects/StickStat
cd /projects/StickStat
npm ci
cp .env.example .env
chmod 600 .env
openssl rand -base64 32
```

Vul `.env` met onder meer:

```env
DATABASE_URL="postgresql://stickstat:URL_ENCODED_PASSWORD@127.0.0.1:5432/stickstat"
AUTH_SECRET="DE_GEGENEREERDE_SECRET"
PORT=4000
HOSTNAME=0.0.0.0
APP_URL="http://TAILSCALE_IP:4000"
SYNC_INTERVAL_MINUTES=60
SEED_ADMIN_EMAIL="jouw-email@example.nl"
SEED_ADMIN_PASSWORD="een-tijdelijk-sterk-seed-wachtwoord"
```

URL-encode bijzondere tekens in het databasewachtwoord. Bouw vervolgens:

```bash
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build
```

Na de eerste seed kan `SEED_ADMIN_PASSWORD` uit `.env` worden verwijderd.

## 4. Eigen user-service

```bash
mkdir -p ~/.config/systemd/user
cp /projects/StickStat/deploy/stickstat.service ~/.config/systemd/user/stickstat.service
which npm
```

Pas `ExecStart` alleen aan wanneer `which npm` niet `/usr/bin/npm` geeft. De service leest secrets uit `/projects/StickStat/.env` en bevat zelf geen wachtwoorden.

```bash
systemctl --user daemon-reload
systemctl --user enable --now stickstat.service
systemctl --user status stickstat.service
journalctl --user -u stickstat.service -f
```

Controleer lingering zonder bestaande instellingen te wijzigen:

```bash
loginctl show-user "$USER" | grep Linger
```

Alleen wanneer dit `Linger=no` toont:

```bash
sudo loginctl enable-linger "$USER"
```

PostgreSQL is een systeemservice; de StickStat user-service wacht op `network-online.target`, herstart na crashes en blijft via lingering na logout actief. Een user-service kan niet betrouwbaar hard afhangen van een system-service; Prisma herstelt databaseverbindingen bij nieuwe requests en systemd blijft StickStat bij een startcrash herstarten.

## 5. Bediening en Tailscale

```bash
systemctl --user restart stickstat.service
systemctl --user stop stickstat.service
journalctl --user -u stickstat.service -f
tailscale ip -4
ss -ltnp | grep 4000
```

Open vanaf een bestaand Tailscale-apparaat `http://TAILSCALE_IP:4000`. Installeer of wijzig Tailscale niet. Publiceer poort 4000 niet via de router/firewall naar internet.

## 6. Update

```bash
chmod +x /projects/StickStat/scripts/update.sh
/projects/StickStat/scripts/update.sh
```

Het script stopt bij elke fout en herstart pas nadat dependencies, migraties, checks en productiebuild slagen. Het bestaande proces blijft tijdens de build draaien; pas de afsluitende restart wisselt naar de nieuwe `.next` build.

## 7. Reboottest

```bash
systemctl --user is-enabled stickstat.service
systemctl is-enabled postgresql
sudo reboot
```

Na opnieuw verbinden:

```bash
systemctl status postgresql
systemctl --user status stickstat.service
ss -ltnp | grep -E '4000|5432'
```

Verwacht: StickStat op `0.0.0.0:4000`; PostgreSQL uitsluitend op loopback `127.0.0.1:5432` en eventueel `[::1]:5432`.
