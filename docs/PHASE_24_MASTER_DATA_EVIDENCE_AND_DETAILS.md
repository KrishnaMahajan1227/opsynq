# Phase 24 — Master Data, Evidence Governance & Detail Drill-down

## What changed

### Dense professional sidebar accordion

- Expanded navigation is now a true top-stacked accordion.
- Closed groups no longer consume artificial vertical space.
- Only the active/open group reveals its child modules.
- Compact mode remains a narrow icon rail.
- Existing collapse/reopen behavior is preserved.

### Universal record drill-down

Major operational tables now support row-click details in a right-side drawer while preserving list context. The drawer is viewport-safe and internally scrollable.

Covered records include:
- Programs
- Contracts / LOA
- Work Orders
- Agencies
- Work Packages
- Beneficiaries
- Item Master
- Warehouses
- Purchase Orders
- Stock positions
- Drivers / Vehicles
- Shipments
- Technician material issues
- Installed assets (existing lifecycle view retained)
- Service cases
- Claims
- Compliance records
- Agency performance
- Approval requests

### Master Data Center

New Company Administration module for governed reusable masters:
- Geography: country, state, district, taluka, village
- Commercial: scheme, component, tender, contract type
- Supply chain: brand, manufacturer, supplier, product category, UOM
- Field operations: pump type, pump capacity, source type

Master data is company scoped and auditable.

### Evidence Control

New configurable evidence requirements for:
- Survey
- Installation
- Final Inspection

Requirement types:
- Photo
- Document
- Signature
- Boolean confirmation
- Text confirmation

Requirements can be mandatory/optional, ordered, and configured with minimum file counts.

### Agency evidence workflow

Agency beneficiary detail now loads the configured evidence checklist from the Company context. Agency users can submit/replace photo evidence directly from the beneficiary workspace. Evidence submissions remain bound to Company, Agency, Work Package and Farmer context.

Company beneficiary detail receives the same evidence status matrix for operational review.

## Security

- Company Master Data configuration: Company Owner / Company Admin only.
- Evidence configuration/verification: Owner/Admin/Quality as appropriate.
- Evidence visibility: only approved operations/program/quality roles.
- Agency evidence submission validates beneficiary-to-agency mapping before accepting evidence.
- Existing `.env` files remain external and are not modified or packaged.

## Demo

`npm run seed:full-demo` now seeds representative Master Data and Evidence requirements/submissions for the demo company so the new modules are immediately showable.
