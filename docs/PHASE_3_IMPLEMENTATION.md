# Phase 3 — Inventory, Procurement, Warehouse & Barcode Foundation

Phase 3 adds the first physical-material control layer above Agency Operations.

## Implemented
- Inventory command center
- Item Master with serial/batch configuration and reorder levels
- Bulk Item Master Excel import with duplicate-file protection
- Warehouse master (central/regional/agency/transit/other)
- Purchase Orders
- Goods Receipt / GRN
- Inventory balances by warehouse + item
- Serialized inventory registry
- Duplicate serial/barcode prevention
- Stock transfers with serial validation
- Barcode/serial lookup
- Camera scanning through the browser BarcodeDetector API where supported
- Hardware scanner/manual fallback
- Inventory audit actions
- Tenant-scoped APIs and role enforcement
- `/api/health`, `npm run doctor`, and `npm run verify:local`

## Intentional scope boundaries
This phase is the transactional foundation, not the complete supply-chain lifecycle. Shipment/driver tracking, agency dispatch, technician issue, farmer installation consumption, return/replacement and advanced reconciliation remain future phases so the validated Agency field workflow is not destabilized prematurely.

## New backend models
- InventoryBalance
- PurchaseOrder
- GoodsReceipt

Existing platform models reused:
- ItemMaster
- Warehouse
- InventorySerial
- StockMovement
- ImportBatch

## API namespace
`/api/platform/inventory/*`

## Security
All inventory routes require an authenticated Platform session and company context. Mutation routes additionally enforce inventory/procurement-capable roles.
