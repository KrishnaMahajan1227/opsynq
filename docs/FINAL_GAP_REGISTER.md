# Opsynq — Remaining Gap Register after Phase 33

## Intentionally deferred product capabilities

1. **Farmer / Beneficiary self-service portal** — explicitly deferred by product direction. Current beneficiary workflows remain Company/Agency/Technician operated.
2. **Self-service forgot/reset-password flow** — Company Admin can reset managed Company accounts, but public self-service recovery with OTP/email delivery is not yet implemented.
3. **External notification delivery channels** — in-app notifications are implemented. SMS, WhatsApp, transactional email and provider delivery receipts require selecting/configuring external providers.

## Accounting boundary

Phase 33 adds operational finance control: procurement commitments, received procurement value, estimated inventory value, claims, receivables and Agency commercial exposure. It does **not** implement a statutory general ledger, accounts payable, bank reconciliation, GST/TDS accounting, journal entries, trial balance, balance sheet or full three-statement accounting system. Those should be handled through a dedicated accounting module or integration (for example, an external ERP/accounting platform) if required.

## Production-environment integrations still deployment-specific

1. **CI/CD and hosting** — cloud provider, domain, TLS termination, deployment pipeline and secret manager remain environment decisions.
2. **Managed backup/restore policy** — database snapshot/export support exists; automated cloud backup schedules and restore drills must be configured in the production infrastructure account.
3. **Observability provider** — health/readiness endpoints and application logs exist; external APM/log aggregation/alerting provider configuration is deployment-specific.
4. **Offline synchronization conflict policy** — queued writes replay automatically. Complex two-user concurrent-edit conflict resolution remains a future collaboration enhancement.
5. **decision service production controls** — decision service integration is server-side and fails safely to deterministic replenishment. Production should set budget/quota monitoring and rotate API keys through a secret manager.

## Product hardening still recommended

1. Browser E2E automation for the complete Program → Beneficiary → Inventory → Shipment → Installation → Claim journey.
2. Standard server-side pagination/sorting across every high-volume module.
3. Central workflow transition/stage-gating engine driven by required evidence.
4. Dedicated 360-degree record workspaces for Beneficiary, Work Package, Shipment, Asset, Service Case and Claim.
5. MFA/SSO and short-lived access-token + refresh-session hardening for enterprise deployments.

## Validation limits of a source release

Source contracts validate syntax, routes, role policies and critical wiring. Complete production certification still requires the target environment's MongoDB, Cloudinary, decision service API, browser/device geolocation, network conditions and installed npm dependencies. Use `verify:demo`, `uat:local`, and `build:all` after deployment.
