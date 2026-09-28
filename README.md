# Opsynq

Global infrastructure and distributed energy execution platform.

## Repository layout

- `apps/platform-web` — Opsynq Platform Superadmin + Company Operations UI
- `apps/agency-web` — preserved, validated Agency Operations application (Farmer / Survey / Technician / Installation / Complaints)
- `services/api` — shared API containing existing Agency APIs and new Platform/Company modules
- `docs` — architecture, setup and phased implementation notes

## Current implementation

### Phase 1
- Platform Superadmin authentication
- Company registration and approval
- Company directory and users
- Tenant foundation and audit

### Phase 2
- Programs
- Contract / LOA master
- Work Orders
- Agency onboarding
- Work Packages and agency allocation
- Approved Farmer / Beneficiary bulk Excel import
- Safe linkage into the existing Agency Operations workflow through `BeneficiaryContext`

### Phase 3
- Inventory command center
- Item Master + bulk Excel import
- Warehouses
- Purchase Orders
- Goods Receipt / GRN
- Warehouse stock balances
- Serial/barcode registry and duplicate protection
- Stock transfers
- Barcode / serial lookup with camera or hardware-scanner fallback

See `docs/INSTALL_AND_RUN.md`, `docs/PHASE_2_IMPLEMENTATION.md`, and `docs/PHASE_3_IMPLEMENTATION.md`.

## Install once

This repository uses npm workspaces. From this root folder run:

```bash
npm install
```

Then run API, Platform UI and Agency UI in separate terminals using the root scripts.


## Current build
Phase 4 adds Logistics, secure driver tracking, agency stock receipt, agency-technician mapping, technician material custody and inventory reconciliation. See `docs/PHASE_4_IMPLEMENTATION.md`. Existing local `.env` files remain user-managed and are not replaced by phase packages.

## Phase 5
Phase 5 closes technician-issued inventory into beneficiary installations and adds Installed Asset, warranty, replacement, returns, damage, POD and shipment discrepancy reconciliation. See `docs/PHASE_5_IMPLEMENTATION.md` and `docs/PHASE_5_LOCAL_TEST.md`.

## Windows / Atlas troubleshooting

If npm reports Rollup/YAML resolution errors or MongoDB Compass reports TLS errors, see `docs/PHASE_5_1_WINDOWS_FIX.md`. Use `npm run db:test` to verify Atlas independently of Compass. Existing `.env` files are not replaced by Opsynq update ZIPs.

## Local start (Phase 6+)

Keep your existing environment files. From the repository root:

```bash
npm run backend
```

In a second terminal:

```bash
npm run frontend
```

`frontend` starts both Platform Web (5173) and Agency Web (5174).

See `docs/PHASE_6_IMPLEMENTATION.md` and `docs/PHASE_6_LOCAL_TEST.md`.

## Phase 7 quick start
Opsynq now includes company analytics, notifications, controlled documents and audit exploration.

Keep your existing `.env` files unchanged.

```powershell
npm run seed
npm run backend
npm run frontend
```

`npm run seed` reads the already-configured `services/api/.env` and safely upserts the Platform Superadmin.

## Phase 8 closure
Opsynq now includes company Quality & Compliance, Agency Performance, controlled Approval Center, bulk master administration and governed CSV exports in addition to the previously completed global/company/agency, inventory, logistics, service, claims, analytics, documents and audit modules.

Local run remains intentionally simple:

```bash
npm run backend
npm run frontend
```

Existing `.env` files are local operator configuration and are not shipped or rewritten by releases.


## Current baseline — Phase 9

Phase 9 adds production automation, SLA/warranty escalation, asset-integrity checks, runtime health, API hardening and controlled company snapshots while preserving all earlier Platform, Company and Agency workflows. Existing real `.env` files are intentionally not included or rewritten.

Primary local run commands remain:

```bash
npm run backend
npm run frontend
```

Operational commands: `npm run automation:run`, `npm run snapshot -- <companyObjectId>`, `npm run verify:local`.

## Phase 10 platform structure
The Platform Web frontend is now organized by business domain under `apps/platform-web/src/features`, with shared `core`, `components`, `layout`, and `styles` layers. See `docs/PHASE_10_ARCHITECTURE_REFACTOR.md`.

## Phase 11 baseline

Phase 11 is the current full integration baseline. It adds screen-completion CRUD, beneficiary import operator tooling, session/UI recovery and source-sanity checks on top of the Phase 10 modular architecture.

Use existing local environment files unchanged.

```bash
npm run backend
npm run frontend
npm run qa:source
```

## Phase 13
Navigation Control Center + tenant-scoped universal search. See docs/PHASE_13_NAVIGATION_AND_SEARCH.md. Existing .env files remain external and unchanged.


## Current baseline — Phase 18

Phase 18 adds operational UAT and data-integrity closure on top of the complete Phase 17 baseline: a Company Readiness & Data Quality workspace, referential-integrity checks across execution/inventory/assets/logistics, portable frontend syntax QA, and live UAT commands.

Existing local `.env` files remain external and unchanged.

```bash
npm run backend
npm run frontend
npm run qa:release
```

See `docs/PHASE_17_ACCESS_AND_OPERATOR_VIEWS.md` and `docs/PHASE_17_LOCAL_TEST.md`.


## Current baseline — Phase 19

Phase 19 is the full-and-final demo readiness baseline. It adds seeded demo accounts, rich cross-module demo data, and bundled survey / installation / service showcase media so you can present Platform, Company and Agency workflows immediately.

Existing local `.env` files are still left untouched.

```bash
npm run seed:full-demo
npm run backend
npm run frontend
```

See `docs/PHASE_19_DEMO_READINESS.md` and `docs/DEMO_ACCOUNTS.md`.


## Phase 19.2 demo closure

Phase 19.2 adds Company Beneficiary Records, enriched Agency beneficiary details with field evidence and Opsynq context, explicit Platform-vs-Agency login guidance, and `npm run verify:demo` runtime verification.

- Platform / Company: `http://localhost:5173`
- Agency Operations: `http://localhost:5174`

Existing `.env` files remain external and are not rewritten.


## Current baseline — Phase 20

Phase 20 introduces **one secure Opsynq login** for Platform, Company and Agency users. Agency users are routed using a short-lived one-time handoff code; passwords and JWTs are never placed in the redirect URL. The Agency Operations UI is also consolidated into a professional grouped navigation shell shared by Superadmin, Admin and the Excel Import Center, while the mobile-first Technician workspace retains its optimized field flow.

Existing `.env` files remain external and unchanged.

```bash
npm run seed:full-demo
npm run backend
npm run frontend
npm run verify:demo
```

See `docs/PHASE_20_UNIFIED_AUTH_AND_AGENCY_REDESIGN.md`.


## Current baseline — Phase 21

Phase 21 standardizes viewport-safe forms and modals, removes repeated screen-title banners, and introduces consistent search + filter ergonomics across Platform, Company and Agency workspaces. Existing local `.env` files remain external and unchanged.

```bash
npm run backend
npm run frontend
```

See `docs/PHASE_21_UI_FORMS_AND_FILTERS.md`.


## Current baseline — Phase 22

Phase 22 adds role-focused workspaces, role-targeted notifications with per-user read state, simplified enterprise navigation, and role-scoped universal search. Company Owner/Admin retain full visibility; specialist roles see only the operational areas relevant to their work. Agency Admin/Superadmin navigation is also simplified and role-focused.

Existing `.env` files remain external and unchanged.


## Current baseline — Phase 23

Phase 23 enforces strict role-owned workspaces and refines the main Company sidebar into a compact professional icon rail when collapsed. Unrelated modules are not exposed as view-only screens. See `docs/PHASE_23_STRICT_ROLE_NAVIGATION.md` and `docs/PHASE_23_ROLE_MATRIX.md`. Existing real `.env` files remain external and unchanged.


## Current baseline — Phase 24

Phase 24 adds a dense accordion sidebar, universal row-click detail drill-down, governed Company Master Data, and configurable Survey / Installation / Final Inspection evidence checklists with Agency-side evidence submission.

Existing `.env` files remain external and unchanged.

```bash
npm run seed:full-demo
npm run backend
npm run frontend
```

See `docs/PHASE_24_MASTER_DATA_EVIDENCE_AND_DETAILS.md`.


## Current baseline — Phase 26

Phase 26 fixes the beneficiary import/detail route collision and adds Asset Insurance, PDI / Pre-Dispatch Inspection, and a Regulatory Reports Center with District × Agency Synopsis, Asset & IMEI Mapping, JCR Office and JCR Installer exports. The Farmer/Beneficiary self-service portal is intentionally deferred.

```bash
npm run qa:release
npm run seed:full-demo
npm run backend
npm run frontend
```

See `docs/PHASE_26_INSURANCE_PDI_REGULATORY_REPORTS.md`. Existing `.env` files remain user-managed and are not packaged or rewritten.


## Current baseline — Phase 27

Phase 27 refines the executive/operator UX: larger compact sidebar typography, role-aware dashboard visuals, role-scoped notification bell, hardened Master Data loading/filters, and complete-record detail drawers. Existing `.env` files remain external and unchanged.


## Current baseline — Phase 28

Phase 28 adds live-update resilience, session continuity, offline read caching and automatic queued-write synchronization for both Platform and Agency applications. Local Vite HMR remains the development fast path; deployed clients watch backend/runtime revision plus the served frontend build and refresh safely without clearing authentication.

Existing local `.env` files remain external and unchanged.

```bash
npm run backend
npm run frontend
```

For a mutable live API server where source files are edited directly:

```bash
npm run production:watch
```

See `docs/PHASE_28_LIVE_RESILIENCE_AND_OFFLINE_SYNC.md`.


## Current baseline — Phase 29

Phase 29 adds restrained role-aware command dashboards, actionable KPI/chart drill-downs, a compact hover/click notification preview, a richer filtered notification center, and a 24-beneficiary scenario-based demo dataset with a larger field-media library. The user-facing frontend is contract-checked to remain English-only.

Existing local `.env` files remain external and unchanged.

See `docs/PHASE_29_COMMAND_DASHBOARDS_AND_DEMO_STORY.md`.


## Current baseline — Phase 30

Phase 30 adds Geo Operations, geo-tagged field evidence and richer audit traceability on top of the Phase 29 command-dashboard and demo-storytelling baseline.

```bash
npm run seed:full-demo
npm run backend
npm run frontend
```

See `docs/PHASE_30_GEO_OPERATIONS_AND_AUDIT.md`. Existing `.env` files remain external and unchanged.

## Current baseline — Phase 31

Phase 31 introduces a role-specific professional dashboard system across Company, Platform and Agency experiences. Company roles now land on a restrained command dashboard composed only from their operational domain, with clickable KPI and drill-down panels. Platform Superadmin and Agency dashboards follow the same neutral visual system, while Technician remains task-first and mobile-first.

Existing local `.env` files remain external and unchanged.

See `docs/PHASE_31_ROLE_DASHBOARD_REVAMP.md`.


## Current baseline — Phase 32

Phase 32 is the functional-closure and release-certification baseline. It repairs Agency modal callback contracts, aligns field values with Farmer schema enums, adds server-side Agency scoping for beneficiaries/users/technicians, secures Field Verification and Installation endpoints, fixes installed-technician persistence, and adds permanent functional regression contracts.

Existing local `.env` files remain external and unchanged.

```bash
npm run qa:release
npm run seed:full-demo
npm run backend
npm run frontend
npm run verify:demo
```

See `docs/PHASE_32_FUNCTIONAL_CLOSURE.md` and `docs/FINAL_GAP_REGISTER.md`.

## Current baseline — Phase 33

Phase 33 adds AI-assisted procurement intelligence, deterministic replenishment planning, low-stock notifications, Agency stock accountability and Company/Agency financial control. Gemini is advisory only; purchase orders remain under manual Owner/Admin approval.

```bash
npm run qa:release
npm run seed:full-demo
npm run backend
npm run frontend
```

See `docs/PHASE_33_AI_PROCUREMENT_AND_FINANCE_CONTROL.md`.

## Current baseline — Phase 34

Phase 34 hardens authentication and adds complete email-based account recovery across Platform, Company and Agency identities. Reset tokens are one-time, hashed-at-rest and expire after 20 minutes; password reset invalidates all prior HTTP and Socket.IO sessions. Authentication now includes tighter rate limits, persisted failed-login lockouts, stronger password policy, security-event logging, NoSQL operator-key rejection and production security configuration checks.

WhatsApp/SMS are intentionally not introduced. Password recovery is email-only. Local development can use console-delivered reset links; production uses the configured email provider.

Real `.env` files are **not included** in the hardened source package. Copy your existing private environment files into place and add the Phase 34 variables from `.env.example`.

```bash
npm run qa:phase34
npm run qa:source
npm run qa:routes
```

See `docs/SECURITY_EMAIL_RECOVERY_2026-09-27.md` and `docs/LOCAL_ENV_MIGRATION.md`.

## Phase 35
Delivery hierarchy and cross-module filters are documented in `docs/PHASE_35_DELIVERY_HIERARCHY_AND_FILTERS.md`.
