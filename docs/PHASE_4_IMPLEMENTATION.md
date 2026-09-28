# Opsynq Phase 4 — Logistics, Agency Allocation & Field Material Custody

## Baseline
Built on Phase 3.1 Windows Hotfix. Existing `.env` files are not included, modified, or overwritten by this phase.

## Added
- Company logistics dashboard
- Driver master
- Vehicle master
- Shipment creation from stocked warehouse inventory
- Serial/barcode validation before dispatch
- Company/central warehouse → agency warehouse dispatch
- In-transit inventory accounting
- Secure expiring driver tracking links (raw token returned once; only hash stored)
- Public trip-bound driver location page
- Driver last-known location persistence
- Company shipment tracking view with OpenStreetMap embed and 10-second refresh
- Agency receipt / proof-of-delivery metadata
- Inventory transition: AVAILABLE → IN_TRANSIT → AGENCY_STOCK
- Agency ↔ legacy technician mapping without altering existing Agency User schema
- Material issue from agency warehouse to mapped technician
- Inventory transition to ISSUED for serialized material
- Stock movement audit records
- Inventory reconciliation dashboard
- Missing / damaged / rejected serialized-asset exception list

## Security / isolation
- Platform logistics APIs require authenticated Platform sessions except the trip-bound public tracking token endpoints.
- Tracking tokens are random 256-bit values and only SHA-256 hashes are persisted.
- Tracking links expire automatically and stop working when shipment leaves active transit states.
- Company tenant context is enforced server-side.
- A technician must be explicitly mapped to the selected agency before company inventory can be issued to that technician.

## Existing Agency flow
Farmer / Survey / Technician / Installation / Final Inspection / Complaint code is preserved. The existing User schema was intentionally not modified.

## Current lifecycle
Item Master → Procurement → GRN → Warehouse Stock → Shipment → In Transit → Agency Receipt → Agency Stock → Technician Issue → future Installation Consumption / Return.

## Next logical work
- Link issued serials/material directly into installation completion so successful installation converts ISSUED → INSTALLED.
- Material return/replacement/damage workflows.
- Partial shipment receipt and discrepancy approval.
- Driver trip stop/POD evidence/photo/signature.
- Notification provider integrations.
- Advanced live logistics map clustering and route history visualization.
