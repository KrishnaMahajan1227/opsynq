# Phase 12 — Runtime Contracts & Platform Control Tower

## Runtime import/export stability
- Fixed `PageHeader` as an explicit named export from `apps/platform-web/src/components/common.jsx`.
- Added `scripts/module-contracts.js`.
- `npm run qa:contracts` verifies local named imports against actual exports.
- `npm run qa:source` now includes module-contract validation so missing named exports fail QA before delivery.

## Platform Superadmin control tower
The platform overview now loads both tenant summary and global portfolio health and shows:
- active and pending companies
- approved beneficiaries across active tenants
- work packages in flight and blocked
- open service workload and SLA breaches
- claim paid / blocked exposure
- inventory serial state distribution
- shipments currently moving
- top companies by beneficiary allocation

The platform layer remains governance/visibility focused. Day-to-day execution stays inside company workspaces.

## Company governance completion
Company detail now supports:
- company profile editing
- company user list
- company user creation
- role/contact updates
- optional password reset on edit
- user deactivation/reactivation
- audit events for company-user changes

All company-user changes remain constrained to the selected company tenant.

## Environment rule
No existing `.env` file is included, rewritten or regenerated in this phase.
