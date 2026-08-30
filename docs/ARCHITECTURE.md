# StickStat-architectuur

## Lagen

```text
React / Next.js pages
        ↓
REST route handlers (/api)
        ↓
Auth, StatisticsService, SyncService
        ↓
Prisma ORM
        ↓
PostgreSQL (alleen localhost)
```

Externe gegevens lopen uitsluitend via `HockeyDataProvider → SyncService → PostgreSQL`. De frontend scrape nooit. De REST-responses hebben steeds `{ "data": ... }` of `{ "error": { "code", "message", "details?" } }`, zodat een Android-app dezelfde backend kan gebruiken.

## Grenzen

- `providers/`: providercontract en bron-specifieke parsing.
- `services/`: businesslogica en transactionele workflows.
- `lib/`: database, auth, logging, rate limiting en validatie.
- `app/api/`: HTTP, validatie en server-side autorisatie.
- `app/` en `components/`: presentatielaag; geen gekopieerde statistiekformules.

Next.js draait als één eigen Node-proces. `instrumentation.ts` start de uurlijkse scheduler; PostgreSQL advisory locks voorkomen dubbele team-syncs, ook na een tweede proces. Iedere sync krijgt een `SyncRun`.

## Security

Wachtwoorden zijn Argon2id-hashes. Sessies gebruiken een random token waarvan uitsluitend de SHA-256-hash in PostgreSQL staat; de browser ontvangt een `HttpOnly`, `SameSite=Lax` en in productie `Secure` cookie. Muterende browser-API-calls krijgen een same-origin check. Zod valideert input, Prisma parameteriseert queries, routes autoriseren op platform-, club- of teamniveau en login heeft rate limiting. De server stuurt veilige headers en verbergt stack traces in normale API-errors.

De in-memory rate limiter is voldoende voor één self-hosted proces. Bij horizontaal schalen moet deze naar PostgreSQL of Redis. Voor Android kan later een aparte short-lived bearer-tokenflow worden toegevoegd zonder de domein-API te wijzigen.
