# Opsynq Phase 18 — UAT & Data Integrity Closure

Phase 18 turns the previous release checks into an operational UAT gate.

## Added
- Company **Readiness & Data Quality** workspace.
- Read-only integrity checks across Work Packages, Beneficiary Context, Inventory Serials, Installed Assets, Shipments and Technician Material Issues.
- Direct links from integrity findings to the owning operational module.
- `npm run uat:contracts` for Phase 18 integration contracts.
- `npm run uat:local` for live API/frontend/auth-boundary checks.
- `npm run uat:release` for the complete release + UAT contract gate.
- Portable JSX syntax validation using installed esbuild first, removing Windows dependence on a Linux TypeScript path.

## Data integrity checks
The readiness screen currently detects:
- Work packages referencing missing Programs / Work Orders / Agencies.
- Beneficiary contexts referencing missing Work Packages / Agencies.
- Beneficiaries not in VALID import state.
- Installed Assets whose serialized inventory record is missing.
- INSTALLED inventory serials without an Installed Asset.
- Active Installed Assets whose serial lifecycle is not INSTALLED.
- Installed serials missing farmer linkage.
- Active shipments with no item lines.
- Delivered shipments missing a delivery timestamp.
- Shipment receipt totals greater than dispatched quantity.
- Technician material issues with no material lines.

These checks are read-only and do not mutate production data.

## Environment rule
Phase 18 does not package, rewrite or regenerate real `.env` files.
