# Services layer

Provider adapters live here. Each provider exposes a narrow, typed interface so the
application code never talks to a vendor SDK directly.

- `unit/` — Unit (virtual bank accounts, deposits, payments). Not yet integrated.
- `currencycloud/` — Currencycloud (FX conversion, international payouts). Not yet integrated.

Rules:

- Files end in `.server.ts` so they can never be bundled into the browser.
- Credentials are read from `process.env` **inside** the calling handler, never at module scope.
- Every adapter returns plain DTOs defined in `src/types`.

Required environment variables when the integrations are switched on:

```
UNIT_API_TOKEN
UNIT_API_BASE_URL
CURRENCYCLOUD_API_KEY
CURRENCYCLOUD_LOGIN_ID
CURRENCYCLOUD_API_BASE_URL
```
