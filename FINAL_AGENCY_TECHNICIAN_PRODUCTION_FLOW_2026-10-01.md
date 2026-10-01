# OPSYNQ Agency + Technician Production Flow — 2026-10-01

## Operational lifecycle
Company Program → Contract/LOA → Work Order → Work Package → Agency → Beneficiary → Survey Assignment → Field Verification → JSR/Review → Installation Preparation → Material Receipt/Issue → Installation → Installed Asset/RMS → Complaint/Rework → Closure.

## Production hardening in this release
- Agency application-status transitions are validated server-side; invalid direct API jumps are rejected with 409.
- Survey submission publishes a company-scoped operational milestone and audit event.
- Installation completion, complaint raise and rework completion publish company-scoped milestones.
- Legacy complaint fields are synchronized with ServiceCase without losing complaint history.
- Installation submit is blocked until the beneficiary is Ready for Installation (except complaint rework).
- Technician installation drafts persist in IndexedDB, including serials, photos, signatures and beneficiary context.
- Offline queued installation requests retain the draft until server sync succeeds.
- Scanner flow validates issued serialized inventory server-side and surfaces scanned metadata; encoded controller IMEI can auto-fill.
- Company dashboard, beneficiary register, notifications, service cases and agency performance silently refresh on tenant revision events without page reload.
- Agency UI uses one final design-token layer for typography, control sizing, search/filter bars, tables, modals, focus states and mobile touch targets.
- Existing no-hard-refresh and resilient map/provider behavior remains covered by regression tests.

## Sync model
Agency writes increment the scoped company/agency revision. Company UI polls the runtime revision and performs in-place refetches. This is near-real-time using the existing polling cycle and does not reset the current page, modal, form or scroll position.

## Security / tenancy
Existing BeneficiaryContext and agency scope remain the ownership boundary. Notifications, audit events and ServiceCase records are populated with companyId/agencyId/farmerId where available. Technician installation inventory is validated against issued inventory and current technician ownership.

## Database migration
No schema migration is required by this release. It reuses existing Notification, AuditLog, ServiceCase, BeneficiaryContext, Farmer, EvidenceSubmission, inventory and installed-asset models.

## Validation
Run after dependency install:

```bash
npm ci
npm run build:all
npm run qa:agency-production-flow
npm run qa:agency-final
```

Targeted source contracts passed in the prepared source tree: Agency production flow 13/13, Agency final workflow 13/13, offline/resilience 11/11, geo/receipt/scanner, map/no-refresh regression, data-integrity, JSX syntax, effects, permissions, role navigation, route contracts, company data-flow, professional UX, UI stability and dashboard/performance.

`source-sanity` still reports the same two pre-existing repository-wide baseline findings unrelated to this release: JSX inside `apps/platform-web/src/core/permissions.js`, and an incomplete single-login frontend contract. No new source-sanity category was introduced by this release.
