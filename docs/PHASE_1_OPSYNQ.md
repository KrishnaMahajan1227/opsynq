# Opsynq Phase 1 — Platform Foundation

## Delivered
- Opsynq rebrand / independent repository namespace.
- Existing Agency Operations frontend + backend preserved.
- Separate Opsynq Platform Web application.
- Public enterprise landing page.
- Company self-registration with pending approval state.
- Dedicated Platform authentication separated from Agency authentication.
- Platform Superadmin-only platform console.
- Company directory, search, status lifecycle and approval queue.
- Company detail workspace.
- Company user creation with tenant-bound roles.
- Backend RBAC and company context foundation.
- Audit logging for company registration, creation, updates, approvals/status changes and company-user creation.
- Existing Program, WorkOrder, WorkPackage, Inventory, Logistics and BeneficiaryContext schemas retained for upcoming phases.

## Intentionally preserved
Farmer, Technician, Survey, Installation, Final Inspection, Complaints and current Agency workflows have not been renamed or rewritten.

## First bootstrap
1. Copy `services/api/.env.example` to `services/api/.env`.
2. Set `MONGO_URI`, `JWT_SECRET` and Platform Superadmin bootstrap values.
3. Run `npm install` at repository root.
4. Run `npm --workspace services/api run seed:platform`.
5. Start API: `npm run dev:api`.
6. Start platform web: `npm run dev:platform`.
7. Existing Agency web remains available via `npm run dev:agency`.

## Phase 2 target
Programs / contracts, Work Orders, Work Packages, Agency onboarding/allocation, approved beneficiary bulk Excel import and linkage into the existing Agency Operations workflow.
