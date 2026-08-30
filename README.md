# StickStat

**StickStat — Your team. Your stats.** is een self-hosted hockey-statistiekenplatform voor meerdere clubs, teams, seizoenen en gebruikers. Het combineert externe wedstrijd- en standgegevens met handmatig beheerde spelersstatistieken zonder die twee databronnen te vermengen.

## Wat zit erin?

- Responsive sportdashboard, wedstrijden, wedstrijddetails, standen, spelersprofielen en Recharts-grafieken.
- Veilige accounts met Argon2, server-side sessies, rollen en memberships.
- Multi-club/multi-team PostgreSQL-datamodel via Prisma.
- REST API voor de webinterface en een latere Android-client.
- Vervangbare `HockeyDataProvider`; initiële implementatie voor Hockeystanden.nl.
- Uurlijkse sync met PostgreSQL advisory locking, handmatige sync en sync-logboek.
- Platform-, club- en teamrollen; alle rechten worden server-side afgedwongen.
- Arch Linux deployment via een eigen `systemd --user` service, volledig los van Flummi.

## Stack en architectuur

Node.js 20+, Next.js 15, React 19, TypeScript strict, PostgreSQL, Prisma, Tailwind CSS, Recharts en Vitest. Zie [architectuur](docs/ARCHITECTURE.md), [database](docs/DATABASE.md), [API](docs/API.md) en [provider](docs/HOCKEY_DATA_PROVIDER.md).

## Lokaal ontwikkelen

1. Installeer Node.js 20+ en PostgreSQL.
2. Maak database en user `stickstat` aan.
3. Voer uit:

```bash
npm install
cp .env.example .env
# Vul DATABASE_URL, AUTH_SECRET en een sterk SEED_ADMIN_PASSWORD in.
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000` (of voeg `PORT=4000` toe aan het dev-command). De seed maakt alleen MHC Rapide, Rapide H1, seizoen 2026/2027, memberships en het opgegeven adminaccount; hij maakt geen nepwedstrijden. Start de echte import via Beheer → Nu synchroniseren.

## Environment

| Variabele | Doel |
|---|---|
| `DATABASE_URL` | Lokale PostgreSQL-connectiestring |
| `AUTH_SECRET` | Gereserveerd voor cryptografische uitbreidingen; minimaal 32 random bytes |
| `PORT` | Webpoort, productie standaard `4000` |
| `HOSTNAME` | Bindadres, productie `0.0.0.0` |
| `APP_URL` | Canonieke app-URL |
| `SYNC_INTERVAL_MINUTES` | Syncfrequentie, standaard `60` |
| `SEED_ADMIN_EMAIL` | Eerste platformbeheerder |
| `SEED_ADMIN_PASSWORD` | Alleen bij seeden; kies minimaal 12 tekens en verwijder daarna desgewenst uit `.env` |

`.env` wordt nooit gecommit. Genereer een secret met `openssl rand -base64 32`.

## Database, migraties en productie

Development: `npx prisma migrate dev`. Productie: `npx prisma migrate deploy`. De productie-app gebruikt altijd `npm run build` en `npm run start`, nooit de devserver. Volledige serverinstructies staan in [Arch Linux deployment](docs/ARCH_LINUX_DEPLOYMENT.md).

Pushes naar `main` kunnen automatisch worden uitgerold via `.github/workflows/deploy.yml`. GitHub Actions verbindt via Tailscale SSH en voert `deploy/auto-update.sh` uit; de service wordt alleen na geslaagde tests, build en eventuele migraties herstart. De updater is incrementeel: `npm ci` draait alleen bij dependencywijzigingen, Prisma alleen bij schemawijzigingen en documentatie/mobile-only commits veroorzaken geen webapp-rebuild.

## Rollen

- `platformRole=admin`: alle clubs, teams, users, memberships, providers en syncs.
- `club_admin`: alleen eigen club en onderliggende teams.
- `team_admin` en `coach`: spelers, events en wedstrijdstatistieken van eigen teams.
- `player` en `viewer`: lezen binnen toegewezen teams.

## Sync en dataveiligheid

De scheduler synchroniseert alleen teams met `externalProvider` en `externalIdentifier`. Externe updates raken uitsluitend wedstrijd-, uitslag- en standvelden. `Player`, `PlayerMatchStats` en `MatchEvent` worden niet door de importer geschreven of verwijderd. Fouten worden opgeslagen in `SyncRun`; bestaande data blijft behouden.

## Kwaliteitschecks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx prisma validate
```

## Troubleshooting

- Databasefout: controleer `systemctl status postgresql`, `DATABASE_URL` en `ss -ltnp | grep 5432`.
- Geen data: controleer Beheer → synchronisatie en `journalctl --user -u stickstat.service -f`.
- Geen toegang: controleer de club- en teammembership; UI-verbergen alleen verleent nooit rechten.
- Poort bezet: controleer `ss -ltnp`; gebruik niet poort 3789 en wijzig zo nodig alleen StickStat `PORT`.

## Documentatie

- [Architectuur](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [REST API](docs/API.md)
- [HockeyDataProvider](docs/HOCKEY_DATA_PROVIDER.md)
- [Arch Linux deployment](docs/ARCH_LINUX_DEPLOYMENT.md)
- [Android/Flutter buildbasis](mobile/README.md)
