# Opsynq Readiness Matrix

| Capability | Status | Primary module |
|---|---|---|
| Platform Superadmin bootstrap | Ready | `seed/bootstrap.js` |
| Company registration / approval | Ready | Platform auth + Companies |
| Company RBAC / tenant context | Ready | Platform auth middleware |
| Programs / Contracts / LOA | Ready | Operations |
| Work Orders / Work Packages | Ready | Operations |
| Agency onboarding / allocation | Ready | Operations |
| Approved Farmer / Beneficiary Excel intake | Ready | Beneficiary Imports |
| Existing Agency field execution | Preserved / Ready | `apps/agency-web` |
| Item Master / bulk Item Excel | Ready | Inventory |
| Procurement / GRN / Warehouse stock | Ready | Inventory |
| Serial / barcode tracking | Ready | Inventory + Scanner |
| Stock movement / reconciliation | Ready | Inventory |
| Shipment / Driver / Vehicle | Ready | Logistics |
| Secure driver tracking link / live map | Ready | Logistics |
| Agency receipt / POD / discrepancy | Ready | Logistics |
| Technician material issue | Ready | Logistics / Agency mapping |
| Farmer installed-asset binding | Ready | Installation + Installed Asset |
| Return / damage / replacement history | Ready | Asset Lifecycle |
| Warranty / AMC / Service | Ready | Service |
| SLA rules / breach monitoring | Ready | Service |
| Claims / receivables | Ready | Commercial Claims |
| Quality / compliance register | Ready | Assurance |
| Approval / waiver governance | Ready | Approval Center |
| Agency performance | Ready | Assurance |
| Bulk master admin | Ready | Bulk Operations |
| Operational exports | Ready | Bulk & Exports |
| Notifications | Ready | Governance |
| Document repository | Ready | Governance |
| Audit trail | Ready | Governance |
| Analytics / management dashboard | Ready | Governance + Dashboard |
| Location tracking | Ready | Agency + Logistics |
| Professional landing / login / registration | Ready | Platform Web |
| One-command backend start | Ready | `npm run backend` |
| One-command complete frontend start | Ready | `npm run frontend` |
| Existing `.env` preservation | Enforced | Packaging rule |

## Deliberately provider-neutral
Outbound Email/SMS/WhatsApp delivery remains provider-neutral by design. Opsynq contains the notification/governance layer; a specific delivery provider is an environment/deployment choice rather than a hard-coded product dependency.

## Phase 9 closure

| Area | Status | Phase 9 closure |
|---|---|---|
| Background automation | Ready | 15-minute MongoDB-leased scheduler plus manual runs |
| Service SLA escalation | Ready | Automatic ON_TRACK / DUE_SOON / BREACHED refresh + notifications |
| Claim SLA escalation | Ready | Automatic claim SLA refresh + notifications |
| Warranty / AMC monitoring | Ready | ACTIVE / EXPIRING / EXPIRED automation + notifications |
| Asset/inventory integrity | Ready | Serialized inventory vs Installed Asset reconciliation scan |
| Automation observability | Ready | Company Automation & Health workspace + run history |
| Runtime health | Ready | Authenticated detailed DB/process health endpoint |
| API hardening | Ready | request IDs, security headers, body limits, auth throttling |
| Graceful shutdown | Ready | SIGINT/SIGTERM and fatal-process handling |
| Operational snapshot | Ready | company-scoped JSON snapshot command for controlled exports/backups |
| Environment preservation | Ready | no real `.env` packaged or rewritten |

## Phase 11 closure

| Area | Status | Closure |
|---|---|---|
| Platform runtime import regressions | Ready | Semantic audit fixed missing dashboard/service helpers |
| Core execution CRUD | Ready | Programs, Contracts/LOA, Work Orders, Agencies support create/search/edit/status/close/archive |
| Work Package lifecycle | Ready | edit/reassign/status/close with assignment-history propagation |
| Beneficiary import operator tooling | Ready | downloadable template + row-level error CSV |
| Session failure recovery | Ready | 401 logout + request timeout handling |
| UI crash recovery | Ready | application-level error boundary |
| Screen registry coverage | Ready | all Company navigation targets resolve to implemented screens |
| Source sanity command | Ready | `npm run qa:source` |
| Existing `.env` preservation | Ready | no real env files packaged or rewritten |

## Phase 12 closure

| Area | Status | Closure |
|---|---|---|
| Platform shared-component contracts | Ready | `PageHeader` export fixed + named import/export QA |
| Runtime module-contract QA | Ready | `npm run qa:contracts` and integrated `npm run qa:source` |
| Global Platform control tower | Ready | Cross-company execution, inventory, logistics, service, commercial and compliance visibility |
| Company profile governance | Ready | Platform Superadmin company edit workspace |
| Company-user governance | Ready | Create/edit/role update/password reset/deactivate/reactivate |
| Tenant-safe company user changes | Ready | Company-scoped backend lookup + audit event |
| Existing `.env` preservation | Ready | no real env files packaged or rewritten |


## Phase 13 status
- Navigation registry and grouped sidebar: READY
- All 33 Company modules resolved: READY
- Ctrl/Cmd+K module switcher: READY
- Universal company-scoped record search: READY
- Platform company search: READY
- Sidebar scroll/compact/mobile access: READY
- Environment files unchanged/not packaged: VERIFIED

## Phase 14 — Production Operations & Reliability
- API liveness/readiness/version probes: CLOSED
- Frontend API readiness visibility: CLOSED
- Linux/Windows upload-path parity: CLOSED
- Frontend→backend mounted-route contract gate: CLOSED
- Platform + Company navigation registry checks: CLOSED
- Release marker gate: CLOSED
- Agency unknown-route recovery: CLOSED
- Production-safe API error payloads/request IDs: CLOSED
- Composite release gate (`npm run qa:release`): CLOSED


## Phase 16 navigation and operator productivity
- Simplified hierarchical Company navigation: READY
- Permanent desktop collapse recovery / expand control: READY
- Mobile navigation drawer: READY
- My Workspace pinned modules: READY
- Recent module tracking: READY
- Per-company browser navigation preferences: READY
- Environment files unchanged/not packaged: READY

## Phase 17 access governance & operator views
- Central company capability policy: READY
- Backend route authorization aligned to central policy: READY
- Frontend role capability awareness: READY
- Company Team & Access management: READY
- Protected Company Owner account semantics: READY
- Company user create/edit/activate/deactivate/password reset: READY
- Audited access changes: READY
- Saved operational views: READY (Work Packages, Service Cases, Claims)
- Permission-denied UX: READY
- JS/JSX parser release gate: READY
- Existing `.env` files unchanged/not packaged: VERIFIED

## Phase 18 UAT & data integrity closure

- [x] Company Readiness & Data Quality workspace
- [x] Execution reference integrity checks
- [x] Beneficiary context integrity checks
- [x] Inventory serial ↔ installed asset consistency checks
- [x] Shipment receipt consistency checks
- [x] Material issue consistency checks
- [x] Runtime unauthenticated boundary smoke checks
- [x] Portable JSX parser for Windows/local QA
- [x] UAT release gate commands


## Phase 19 demo & showcase closure

- [x] Final Vite JSX extension issue fixed (`permissions.jsx`)
- [x] Release QA rejects JSX stored in `.js` frontend modules
- [x] Full demo company accounts
- [x] Full demo agency superadmin/admin/technician accounts
- [x] Demo Programs / LOA / Work Orders / Work Packages
- [x] Demo beneficiary/farmer operational lifecycle records
- [x] Demo inventory / serials / warehouses / procurement / GRN
- [x] Demo shipments / driver tracking / material issue
- [x] Demo installed assets / warranty / service
- [x] Demo claims / compliance / approvals / notifications / documents
- [x] Six bundled professional field images served by API
- [x] Re-runnable demo seed command
- [x] Existing `.env` remains external and unchanged
