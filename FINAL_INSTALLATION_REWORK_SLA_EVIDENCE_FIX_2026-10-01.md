# OPSYNQ Agency/Technician final installation + rework + SLA/evidence fix

## Fixed
- Normal successful installation no longer depends on complaint fields. Complaint/rework data is required only when Installation Completed = No or Pump Operating = No.
- Company-governed INSTALLATION / FINAL_INSPECTION evidence is the completion gate. Legacy installations without Company evidence rules keep the original farmer + technician signature gate.
- Installation errors return/show the exact pending Company evidence items instead of a generic failure.
- Existing legacy survey evidence is read-compatible with newer Company evidence rules, preventing already-completed demo/client records from becoming falsely pending.
- Field verification no longer creates duplicate default evidence rows when Company SURVEY requirements already exist.
- Company SLARule entries for SURVEY / INSTALLATION / FINAL_INSPECTION are returned to Agency/Technician and shown stage-wise. Program slaConfig remains only a backward-compatible fallback.
- Company evidence DOCUMENT rules support PDF upload through the governed evidence endpoint; operational photo/signature endpoints remain image-only.
- Admin and Superadmin rework assignment now use the scoped assignment endpoint. Admin assignment keeps approval workflow; Superadmin applies directly.
- Approved rework assignment updates ServiceCase ownership/status and publishes the required Company progress event.
- Failed rework remains IN_PROGRESS/open. Successful rework preserves complaint history, resolves the ServiceCase, and publishes rework completion.
- Evidence checklist professional styles moved into the stylesheet that is actually loaded at runtime. Stage/type/status/upload/preview are visually separated and responsive.

## Validation
- Backend syntax: 149 files pass.
- Frontend JSX syntax: 82 files pass.
- Exact final regression: 16/16 pass.
- Agency production flow: 13/13 pass.
- Agency final workflow: 13/13 pass.
- Offline resilience: 11/11 pass.
- Permissions, roles, route contracts, data integrity, UI stability, scanner, map/no-refresh and prior final UI regressions pass.

## Existing unrelated baseline findings
`source-sanity` still reports the two pre-existing platform findings from the incoming project:
- `apps/platform-web/src/core/permissions.js` contains JSX in a `.js` file.
- legacy single-login frontend contract is incomplete.

## Build
The sandbox does not contain installed workspace dependencies (`vite: not found`), so the Vite production bundle cannot be executed here. On the deployment machine run:

```bash
npm ci
npm run build:all
node scripts/final-installation-rework-evidence-sla-regression.js
npm run qa:agency-production-flow
npm run qa:agency-final
```
