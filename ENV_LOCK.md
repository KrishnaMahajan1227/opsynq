# Opsynq Environment Lock

The `.env.example` files define the canonical variable names for Opsynq. Real `.env` files are private operator configuration and are intentionally excluded from source/release ZIPs.

## Placement
Create each private `.env` from the matching `.env.example` (or copy it from your existing private working installation) without renaming it:

- `services/api/.env`
- `apps/platform-web/.env`
- `apps/agency-web/.env`

## Policy for future phases
Do not rename, remove, or silently change these environment variables in future phase updates.
If a new feature requires a new variable, add it without changing the existing variables unless a migration is explicitly documented.

## Security
These files contain real credentials and must NOT be committed to Git or shared publicly.
Keep `.env` in `.gitignore`.

## Run order
From the repository root:

1. `npm install`
2. `npm run doctor`
3. `npm --workspace services/api run seed:platform`
4. `npm run dev:api`
5. `npm run dev:platform`
6. `npm run dev:agency`

After all three servers are running:
7. `npm run verify:local`

## Phase 34 — Security / email recovery variables
The following variables are additive and must be configured for production account recovery:

- `AGENCY_JWT_EXPIRES_IN` — default `24h`.
- `TRUST_PROXY` — use `1` only behind your trusted reverse proxy/load balancer.
- `PUBLIC_APP_URL` — canonical Platform web URL used in password reset links.
- `EMAIL_PROVIDER` — `console` for local development, `resend` for production.
- `EMAIL_FROM` — verified sender identity.
- `RESEND_API_KEY` — production provider API key; never commit it.

WhatsApp/SMS variables are intentionally not introduced in this phase.
