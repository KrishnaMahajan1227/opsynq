# Phase 30 — Geo Operations, Geo-Tagged Evidence & Audit Intelligence

Phase 30 adds geographic execution visibility and stronger field traceability without changing the existing tenant or role model.

## Geo Operations

New Company workspace module: `Delivery > Geo Operations`.

Available to Company Owner, Company Admin, Operations Manager, Program Manager and Quality User through the existing role-filtered navigation.

Capabilities:
- OpenStreetMap-based portfolio map
- beneficiary/site pins from recorded site coordinates or geo-tagged evidence
- execution-status, survey-status and district filters
- beneficiary / agency / program / work-package context in pin details
- map detail drawer with coordinates, accuracy, capture source and capture time
- search by beneficiary, district, village or agency

## Geo-tagged field evidence

New field evidence submissions capture, when the browser grants permission:
- latitude
- longitude
- accuracy
- capture timestamp
- source
- capturing user ID
- capturing username
- capturing role

The Agency evidence workflow requests high-accuracy device location at submission time. Location failure does not destroy an otherwise valid upload, but geo metadata is recorded whenever permission/location is available.

Agency beneficiary media and evidence cards display the geo stamp visibly next to the evidence.

## Audit improvements

The Company Audit Trail now includes:
- actor identity and role
- action and entity filters
- date-range filters
- search across actor/action/entity/reason
- row-click detail drawer
- before-change payload
- after-change payload
- entity and audit IDs
- request IP and client metadata where available

Agency field evidence submissions also generate Company AuditLog events (`FIELD_EVIDENCE_SUBMITTED`).

## Demo readiness

The Phase 30 demo seed includes geo-tagged evidence across multiple beneficiary scenarios so the map and evidence traceability can be demonstrated immediately.

## Existing environment files

Opsynq release archives do not include or rewrite real `.env` files.
