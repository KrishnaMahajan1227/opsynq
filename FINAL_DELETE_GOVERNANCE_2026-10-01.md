# OPSYNQ Delete Governance

Implemented project-wide destructive-action hardening for beneficiary and Agency user deletion paths.

## Rules
- Hard delete is allowed only for records with no protected operational history.
- Operational history includes installed assets, material issues, beneficiary material receipts, service cases, evidence, compliance, insurance, RMS telemetry/alerts/devices/current state, asset lifecycle and beneficiary-bound inventory serials.
- Protected records return a dependency summary and must be closed/archived/deactivated instead of hard-deleted.
- Agency Superadmin supports single, bulk and guarded DELETE ALL beneficiary operations.
- Company Admin/Owner and Platform Superadmin support single, bulk and guarded DELETE ALL beneficiary operations.
- DELETE ALL requires exact `DELETE ALL` server confirmation plus an audit reason and aborts atomically at the logical level if protected dependencies exist.
- Agency user deletion is blocked when operational technician history exists; deactivate the account instead.
- Single and bulk destructive UI flows perform delete-impact preflight before confirmation.
- High-risk confirmations require typed `DELETE` plus a reason.
- Beneficiary ownership context is deleted together with the Farmer for safe pre-execution deletes.
- Work Package assigned beneficiary counts are recalculated after Agency deletions.
- Delete actions remain auditable via AdminChangeLog / platform audit trail.

## Validation
- Delete governance regression: 18/18 PASS
- Agency final workflow: 13/13 PASS
- Route contracts: PASS
- Permission contracts: PASS
- UI stability contracts: PASS
- Beneficiary material custody regression: 18/18 PASS
- Backend syntax: PASS

Repository-wide source sanity retains only the two known baseline findings unrelated to this change: JSX inside `apps/platform-web/src/core/permissions.js` and the existing incomplete single-login frontend contract.
