# Opsynq Phase 8 — Assurance, Approvals, Agency Performance & Operational Closure

Phase 8 is a closure/hardening release built on the complete Phase 7 repository. It does not rewrite or replace the validated Agency Operations layer and does not ship or modify any `.env` file.

## Added in Phase 8

### Quality & Compliance
- Company-level compliance register linked to the existing approved Farmer/Beneficiary context.
- Installation, final-inspection, commissioning, claim-readiness and service review types.
- Governed checklist with PASS / FAIL / PENDING / WAIVED controls.
- Review notes, reviewer, timestamps and audit history.
- Compliance exceptions surfaced on the Company dashboard.

### Agency Performance
- Company-wide factual agency scorecards based on assigned beneficiaries, surveys, installations, delayed work packages and service/complaint workload.
- Searchable professional data grid.
- No decorative ranking or arbitrary score.

### Approval Center
- Controlled exception requests for work-package changes, inventory adjustments, serial overrides, claim exceptions, compliance waivers and service exceptions.
- APPROVED / REJECTED / CANCELLED decisions with explicit decision reason and audit trail.
- Pending approvals surfaced on the Company dashboard.

### Bulk Operations & Exports
- Bulk Excel upsert for Agencies, Warehouses, Drivers and Vehicles.
- Existing Beneficiary/Farmer and Item Master bulk imports remain unchanged.
- Governed CSV exports for Agencies, serialized Inventory, Shipments, Service Cases, Claims and Compliance.

### Dashboard closure
- Existing management dashboard now includes compliance exceptions and pending controlled approvals without reintroducing duplicate KPI strips.

## Backward compatibility
- Existing `Farmer` schema is not renamed or structurally rewritten by Phase 8.
- Existing Agency Superadmin/Admin/Technician flows remain in `apps/agency-web`.
- Existing inventory, logistics, service, claims, documents, notifications and audit modules remain intact.
- Existing `.env` files are never generated, rewritten or packaged.

## Run model
From the repository root:

```powershell
npm run seed
npm run backend
```

In a second terminal:

```powershell
npm run frontend
```

Optional verification:

```powershell
npm run db:test
npm run verify:local
```

## External operational prerequisites
These are deployment/configuration prerequisites, not missing application modules:
- MongoDB Atlas connectivity and credentials supplied in the existing local `.env`.
- Cloudinary credentials supplied in the existing local `.env` for document/evidence uploads.
- HTTPS is required in production for reliable browser geolocation/camera permissions.
- Email/SMS/WhatsApp delivery providers can be connected to the existing notification architecture when the organization selects a provider; no provider is hard-coded into the platform.
