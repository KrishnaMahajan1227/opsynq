# Phase 47 — Agency Performance & Finance Drill-down

## Agency Performance
- Rebuilt Agency Performance into a factual operating scorecard covering beneficiary assignment, survey coverage, installation completion, package exceptions, service pressure, material receipt accountability and last activity.
- Added State, attention and completion-band filters plus search across Agency name/code/contact/state.
- Added direct drill-downs to Beneficiaries, Work Packages, Service Cases, Claims and Agency Material Accountability.
- Replaced per-Agency N+1 count queries with grouped MongoDB aggregations for beneficiaries, work packages, service cases and shipments.

## Financial Control
- Strengthened calculations with procurement receipt %, inventory pricing coverage, claim realization %, material receipt %, damage/missing exceptions and outstanding receivables.
- Fixed Agency claim attribution to follow the real model: Claim -> Work Package -> Agency (CommercialClaim does not store agencyId directly).
- Added direct KPI and Agency-row drill-downs to Procurement, Stock, Claims, Agency Performance and Material Accountability.
- Added Agency State and exposure filters.

## Related drill-downs
- Service Cases and Claims now accept Agency filters from related workspaces.
- Claims display the linked Agency through the Work Package relationship.
- Analytics summary cells provide direct navigation to source modules.

## Scale and integrity
- Agency performance endpoint uses grouped aggregation/maps instead of repeated per-Agency database counts.
- Finance controller uses maps for work packages, shipments, assets and claims instead of repeated array scanning per Agency.
- No arbitrary composite score is invented; all displayed percentages are derived from traceable operational counts or monetary values.
