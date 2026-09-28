# Phase 38 — Beneficiary Evidence, Inventory & Dispatch Data Flow

## Purpose
Phase 38 closes the operational traceability gap between Agency field execution and Company oversight. It also strengthens procurement, inventory, dispatch and Agency material accountability for larger datasets without creating duplicate workflows.

## 1. Beneficiary 360° record and lineage
- Beneficiary records remain the Company master record and are reachable from Work Package previews, installed assets, service/warranty, compliance, regulatory/assurance and material-custody views through a shared beneficiary navigation action.
- The Beneficiary 360° view shows Program → Contract/LOA → Work Order → Work Package → Agency lineage, record source/import batch, assignment history, surveyor identity, survey status, execution status, evidence, material custody, installed assets, service history and compliance.
- Work Package beneficiary rows now open the same master beneficiary record instead of becoming an isolated copy.

## 2. Agency survey evidence → Company evidence ledger
When an Agency surveyor submits field verification, uploaded beneficiary photo, site survey photos and beneficiary signature continue to update the legacy Farmer record and are also mirrored into the governed Company evidence ledger.

Each mirrored evidence submission carries:
- Company / beneficiary / Work Package / Agency linkage
- Survey stage and evidence requirement
- source = `AGENCY_FIELD_SURVEY`
- submitting Agency user identity/role
- capture time and geo coordinates when supplied by the device
- original file metadata / Cloudinary URL

This gives Company users a traceable answer to “where did this photo/data come from, who submitted it and for which execution package?”

## 3. Beneficiary bulk operations
Authorized Company operations users can multi-select beneficiaries and apply controlled bulk updates to survey status, execution status and an operational note. Hard deletion is intentionally not exposed for beneficiary/evidence/custody records because these are audit and compliance records; lifecycle correction is performed through status/reconciliation workflows instead.

## 4. Procurement and warehouse control
- Purchase Orders: server-side search/filter/pagination, edit while open, and audited non-destructive cancellation when no receipt exists.
- GRN remains the receipt-of-record for procurement.
- Warehouse Stock & Transfers: server-side pagination, warehouse/item search filters and existing transfer controls.
- Professional navigation naming now distinguishes Supply Chain Overview, Purchase Orders & GRN, Warehouse Stock & Transfers, Dispatch Overview, Dispatch & Shipment Tracking, Technician Material Custody and Agency Material Accountability.

## 5. Dispatch → Agency receipt → Technician custody
Company shipment flow now supports explicit Work Package linkage and scalable shipment filtering/pagination.

Custody chain:
`Purchase Order → GRN → Warehouse Stock/Serial → Shipment → Agency Receipt → Agency Stock → Technician Issue → Beneficiary Installation / Installed Asset`

- Draft shipments can be cancelled with audit history; dispatched/in-transit material cannot be deleted and must be reconciled.
- Company Agency Material Accountability shows dispatched, received, in-transit, damaged, missing, Agency stock and technician-issued quantities.
- Agency summary calculations use MongoDB aggregation instead of repeatedly scanning every shipment for every Agency.
- Detail view provides paginated dispatch history and technician issue history with Work Package and beneficiary context.

## 6. Agency inbound material workspace
Agency Admin/Superadmin navigation exposes **Inbound Material & Receipt Accountability**.
- Search by shipment/tracking number
- Shipment-status filtering
- 25-row server pagination
- Work Package context
- Receiver identity
- good/damaged/missing quantities
- serial-level accountability for serialized items
- notes and proof-of-delivery audit trail

## 7. Scale design
- Beneficiary register: server-side pagination/filtering.
- Procurement: 25-row server pagination.
- Stock: 50-row server pagination.
- Company shipments: 25-row server pagination.
- Agency inbound shipments: 25-row server pagination.
- Agency material summary: database aggregation.
- Mongo indexes added for shipment Agency/status/time, Work Package shipment lookup, material issue Agency/beneficiary/time, PO status/date, warehouse/status, GRN PO/time and beneficiary evidence stage/time.

The UI therefore does not attempt to render tens of thousands of operational records in one DOM table.

## 8. QA
- `npm run qa:release`: PASS after Phase 38 changes.
- JSX parser: all 67 frontend JS/JSX files PASS.
- Backend syntax: 123 files PASS.
- API route contract coverage: PASS.
- Phase 24–38 source contracts: PASS.
- A clean dependency reinstall / Vite binary build could not complete in the packaging sandbox because the npm install call timed out; no partial `node_modules` or build output is included in the release.
