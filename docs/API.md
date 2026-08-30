# REST API

Alle responses zijn JSON: succes `{ "data": ... }`; fout `{ "error": { "code", "message" } }`. Browserauth gebruikt de StickStat-sessiecookie. Schrijfacties vereisen passende rollen.

| Method | Pad | Toegang / doel |
|---|---|---|
| POST | `/api/auth/login` | publiek, rate-limited |
| POST | `/api/auth/register` | publiek, rate-limited; maakt standaardgebruiker |
| POST | `/api/auth/logout` | ingelogd |
| GET | `/api/me` | eigen account en memberships |
| GET/POST | `/api/clubs` | zichtbare clubs / platform-admin maakt club |
| GET/PATCH | `/api/clubs/:clubId` | club lezen / club-admin wijzigen |
| POST | `/api/clubs/:clubId/logo` | club-admin, multipart veld `logo` |
| GET/POST | `/api/teams` | zichtbare teams / platform- of club-admin maakt team |
| GET/PATCH | `/api/teams/:teamId` | team lezen / platform- of club-admin wijzigen |
| GET | `/api/teams/:teamId/matches` | teamleden |
| GET | `/api/teams/:teamId/standings` | teamleden |
| GET/POST | `/api/teams/:teamId/players` | lezen / coach of team-admin |
| GET | `/api/teams/:teamId/stats` | centrale teamstatistieken |
| POST | `/api/teams/:teamId/sync` | coach, team-admin of platform-admin |
| GET | `/api/matches/:matchId` | geautoriseerd teamlid |
| POST | `/api/matches/:matchId/events` | coach of team-admin |
| PUT | `/api/matches/:matchId/player-stats` | upsert door coach of team-admin |
| GET | `/api/players/:playerId` | speler en wedstrijdhistorie |
| GET/POST | `/api/admin/users` | platform-admin |
| POST | `/api/admin/memberships` | platform-admin of club-admin binnen eigen club |

Voorbeeld:

```json
POST /api/matches/abc/player-stats
{
  "playerId": "cl...",
  "started": true,
  "minutesPlayed": 70,
  "goals": 2,
  "assists": 1,
  "saves": 0,
  "mvp": true
}
```

De toekomstige Android-client hoort een aparte token-login te krijgen; accepteer nooit een user- of role-ID uit de client als autorisatiebewijs.
