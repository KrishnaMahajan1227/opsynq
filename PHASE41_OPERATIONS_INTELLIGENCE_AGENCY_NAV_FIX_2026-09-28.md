# Phase 41 — decision service AI Runtime, Agency Crash Fix & Supply Navigation

## Runtime fix
- Removed beneficiary bulk-selection UI accidentally injected into `AgencyDirectory`; this was the source of `selectedIds is not defined`.
- Added a Phase 41 source contract that fails if AgencyDirectory references beneficiary-only `selectedIds` state again.

## decision service AI
- decision service remains backend-only; no API key is shipped to either Vite frontend.
- Added `/api/platform/ai/status` health check and `/api/platform/ai/brief` grounded read-only operations advisory.
- Added `Opsynq AI Operations` company workspace with Executive, Delivery, Supply, Service and Finance scopes.
- AI receives compact operational aggregates rather than unrestricted database records.
- AI output is advisory only: no create/update/delete/dispatch/payment/approval actions.
- Added request rate limiting, API timeout, model fallback and audit logging.
- Existing Financial Control `AI finance brief` route is now actually registered and functional.
- Existing Procurement Intelligence decision service advisory remains intact.

## Supply navigation
The Supply Operations sidebar now exposes only high-frequency daily workspaces:
1. Supply Chain Control
2. Procurement & GRN
3. Warehouse Stock
4. Dispatch Tracking
5. Fleet & Capacity

Specialized screens (PDI, scanner, technician custody, agency accountability, etc.) remain available through the Supply Chain Control workspace, search/deep links and role permissions.

## Deployment
- Keep `AI_PROVIDER_API_KEY` server-side in Vercel Environment Variables.
- Leave `AI_MODEL` blank unless the deployment team intentionally overrides the tested runtime default.
- Redeploy after environment-variable changes.
