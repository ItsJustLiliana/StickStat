# HockeyDataProvider

`providers/types.ts` definieert `getClub`, `getTeam`, `getMatches` en `getStandings`. `HockeyStandenProvider` is de eerste implementatie. Een latere `LisaProvider` of `KnhbProvider` implementeert hetzelfde contract en wordt alleen in de providerregistry geregistreerd.

## Hockeystanden

Bron voor de initiële seed: `https://hockeystanden.nl/team/mhc-rapide/h1`, identifier `mhc-rapide/h1`. De parser gebruikt actuele Schema.org `SportsTeam`- en `SportsEvent`-JSON-LD en een defensieve DOM-fallback voor tabellen/lijsten. Requests hebben een herkenbare user-agent, timeout en geen cache.

Parserwijzigingen moeten eerst langs de opgeslagen fixture en, wanneer internet beschikbaar is, de live bron. Bewaar bij een defect tijdelijk een geschoonde HTML-snapshot buiten Git; log geen cookies of tokens.

## Syncregels

- Alleen providerconfiguratie op het team activeert sync.
- Eén PostgreSQL advisory lock per team.
- Eerst ophalen/parsen, daarna wedstrijden en standen upserten.
- Matchvelden van de bron mogen wijzigen; `PlayerMatchStats` en `MatchEvent` nooit.
- Een fout markeert `SyncRun=failed`, verwijdert niets en stopt de app niet.
- Provider-ID en natuurlijke sleutel voorkomen dubbelen.
