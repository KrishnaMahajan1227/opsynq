# Opsynq Phase 9 — Production Hardening & Automation

Phase 9 keeps the validated Agency workflow and all Phase 1–8 functionality intact. No real `.env` file is included or rewritten.

## Added

- Database-leased 15-minute automation scheduler (safe against duplicate processing by multiple API instances).
- Service SLA state recalculation and breach/due-soon notifications.
- Claim SLA state recalculation and breach/due-soon notifications.
- Warranty/AMC ACTIVE → EXPIRING → EXPIRED automation and notifications.
- Installed-asset / serialized-inventory integrity scan.
- Company Automation & System Health workspace with manual Run Now controls and run history.
- AutomationRun audit records with status, metrics and failure details.
- Runtime health endpoint with MongoDB state, DB name, uptime and memory.
- Request IDs and secure baseline response headers.
- Platform authentication rate limiting.
- JSON/body-size guards.
- Graceful API shutdown handling.
- Manual all-company automation command.
- Company operational snapshot export command for controlled backups/reconciliation.

## Commands

Existing simple run flow is unchanged:

```powershell
npm run backend
npm run frontend
```

Optional operations:

```powershell
npm run automation:run
npm run snapshot -- <companyObjectId>
npm run db:test
npm run verify:local
```

`npm run snapshot` writes into `services/api/backups/`, which is runtime output and should not be committed.

## Environment rule

Phase 9 does not add, regenerate, or overwrite any real `.env` file. Existing configured values remain the source of truth.
