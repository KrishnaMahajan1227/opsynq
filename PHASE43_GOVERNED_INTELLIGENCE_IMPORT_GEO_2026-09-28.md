# Phase 43 — Governed Operations Intelligence, Imports & Geo Detail

## Supply Operations
- Supply Chain Control is a progressive control tower, not a dumping ground.
- Procurement & GRN, Warehouse Stock, Dispatch Tracking, and Fleet & Capacity stay directly accessible in navigation and keep their own active state.
- Specialized tools stay one level deeper under Supply Chain Control.

## Governed Operations Intelligence
- Product UI is provider-neutral. External model/provider branding is not shown in the application.
- The backend credential remains server-side only.
- Automated monitoring can create reviewable system proposals; controlled actions still require an authorized human confirmation.
- Replenishment risk can prepare a DRAFT purchase order and approval request. The order is only issued after confirmation.
- Service SLA risk can prepare a priority-escalation proposal.
- Claim SLA risk can prepare a formal follow-up proposal.
- Warranty/AMC and insurance expiry can prepare review proposals.
- Vercel uses the daily Hobby-compatible automation cron; non-Vercel runtime keeps the existing in-process scheduler.

## Excel governance
- Company beneficiary, company master, inventory item, and Agency beneficiary/JSR imports provide downloadable templates.
- Required/standard columns map into governed schema fields.
- Unknown source columns are preserved as Custom Fields/import extras instead of silently discarded or dynamically changing the core schema.
- Beneficiary 360 shows preserved additional imported fields when they exist.

## Geo detail
- Geo Operations detail now includes delivery context, survey/verification, synchronized photo evidence, and material/asset/service summary.
- Full Beneficiary 360 remains one click away for the complete operational record.
