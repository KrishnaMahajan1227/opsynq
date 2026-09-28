# Opsynq Phase 6 — Service, SLA & Commercial Control

Phase 6 builds on the Phase 5.1 stability baseline. Existing Agency Operations, inventory, logistics, installed-asset, authentication and environment files are not replaced.

## Added

### Service / Warranty / AMC
- ServiceCase model and company workspace
- Case types: complaint, warranty, AMC, preventive maintenance, breakdown
- Priority, owner-ready fields, due date, SLA state, resolution lifecycle
- Optional installed-asset linkage
- Asset lifecycle SERVICE_OPENED / SERVICE_CLOSED audit events
- Warranty/AMC service plans tied to installed serials
- Coverage expiry / 30-day exposure visibility

### SLA engine
- Configurable company SLA rules
- Service-case rules by case type and priority
- Claim SLA support
- Calculated ON_TRACK / DUE_SOON / BREACHED states
- No manual-only "delayed" dependency

### Claims & commercial milestones
- CommercialClaim model
- Draft → Ready → Submitted → Review → Approved/Partially Approved → Paid lifecycle
- Gross, eligible, approved, paid and blocked value
- Block reason and beneficiary count
- Claim SLA starts on submission when a rule is configured

### Company dashboard
- Single Management Attention strip
- Work packages in flight
- Open service cases
- SLA breaches
- Warranty/AMC expiry exposure
- Blocked claim value
- Execution package health
- Claim realization panel
- Recent service activity

### Local developer experience
- `npm run backend` starts the complete API
- `npm run frontend` starts Platform Web and Agency Web together
- Existing aliases remain available
- No new npm package is required for the dual-frontend launcher

## Compatibility
- Existing Farmer / Technician / Survey / Installation terminology and workflows remain intact.
- Existing Agency complaint flow is not deleted or renamed.
- Company service cases are an upper-layer operational/service governance object and can later map legacy complaints through the `LEGACY_COMPLAINT` source.
- No existing `.env` is included or overwritten.
