# Phase 32 — Functional Closure & Release Certification

Phase 32 is a functional-hardening release rather than a visual feature release. The objective is to validate critical workflows, close runtime/security wiring defects, and make future regressions detectable by the release gate.

## Fixed in this phase

### Agency beneficiary isolation
- Agency Admin/Superadmin lists are constrained to beneficiaries mapped to their linked agency.
- Field Technicians receive only beneficiaries assigned to them within their linked agency.
- Individual beneficiary reads, edits, bulk updates, deletes, detail-context reads and evidence submissions enforce the same server-side scope.
- Legacy deployments with no AgencyUserLink mappings retain the previous compatibility behavior; field technicians still remain assignment-scoped.

### Agency user and technician isolation
- `/api/users` and `/api/users/technicians` are constrained to the authenticated user's linked Agency when mappings exist.
- User update/delete cannot target a user outside the actor's Agency.
- Newly registered Agency users are linked back to the creating Superadmin's Agency.
- Role query filtering is now honored server-side.

### Agency modal workflow repair
- Edit Farmer supports the callback contracts used by both Admin and Superadmin workspaces.
- Order Placement supports both historical and current callback names.
- Material location values now exactly match the Farmer schema (`On Site`, `Warehouse`).

### Field workflow security
- Field Verification validates the beneficiary ID and verifies beneficiary access before updating.
- Installation Completion verifies beneficiary access before asset/farmer updates.
- Technician-issued-material lookup verifies access before returning custody data.
- Installation Completion now writes the technician name to the real `installedByTechnicianName` Farmer field.
- Request body/file debug logging was removed from installation completion.

## Permanent release checks

Run:

```bash
npm run qa:phase32
```

The Phase 32 contract blocks releases if the above scope, callback or schema-alignment guarantees regress.

## Recommended local certification

With the existing local `.env` files and MongoDB available:

```bash
npm run qa:release
npm run seed:full-demo
npm run backend
npm run frontend
npm run verify:demo
npm run uat:local
npm run build:all
```

The source ZIP intentionally does not include or rewrite real `.env` files.
