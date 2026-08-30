# Database

Het schema staat in `prisma/schema.prisma`; productie-migraties in `prisma/migrations`.

## Relaties

- `User ↔ Club` via `ClubMembership`; `User ↔ Team` via `TeamMembership`.
- `Club → Team`; `Team ↔ Season` via `TeamSeason`.
- `Match` verwijst naar een expliciet seizoen, thuis- en uitteam.
- `Standing` is uniek per seizoen, competitie en team.
- `Player` behoort aan een team en kan optioneel aan één account gekoppeld zijn.
- `PlayerMatchStats` is uniek per wedstrijd/speler; `MatchEvent` legt uitbreidbare events vast.
- `SyncRun` bewaart iedere importpoging.

Dubbele wedstrijden worden op twee niveaus voorkomen: unieke provider-ID en unieke combinatie seizoen/thuisteam/uitteam/datum. Historische seizoenen blijven bestaan. Externe syncs muteren geen relaties naar spelersstatistieken of events.

## Commands

```bash
npx prisma generate
npx prisma migrate dev       # lokaal
npx prisma migrate deploy    # productie
npm run prisma:seed
npx prisma studio            # alleen lokaal/beheerd
```

Maak voor schemawijzigingen altijd een nieuwe migratie; wijzig een al uitgerolde migratie niet.
