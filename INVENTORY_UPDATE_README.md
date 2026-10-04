# Inventory update

## What changed
- Item Master now clearly separates product/SKU definitions from physical stock units.
- From an Item Master record, **Receive stock / add units** opens a fast direct receipt flow.
- Serialized items support repeated scanner input plus bulk manual paste (newline/comma/tab/semicolon).
- Duplicate serials are blocked in the current receipt and against existing company inventory.
- Batch-tracked items require a batch number at receipt.
- Company Admin/Owner and Platform Superadmin can permanently delete only completely unused Item Master records.
- Any item with stock, serials, movements, procurement, receipts, shipments, field issue, installed asset, PDI or replenishment history is hard-delete blocked; archive remains the safe lifecycle action.
- Permanent deletion requires reason + typed `DELETE` and is audit logged.

## Typical pump workflow
1. Create one Item Master row per distinct pump model/SKU. Multiple pump models can use the same `Pump` category.
2. Open that Item Master row and choose **Receive stock / add units**.
3. Select warehouse and batch (when batch tracked).
4. For serialized pumps, scan each serial/barcode continuously or paste all serials at once. For quantity-only items, enter quantity.
5. Post stock receipt. Inventory balance, serial registry and stock movement are created by the existing governed GRN flow.

## QA run in packaging environment
- `node scripts/inventory-bulk-unit-regression.js` — pass
- backend controller/routes `node --check` — pass
- `node scripts/permission-contracts.js` — pass
- `node scripts/delete-governance-regression.js` — 18/18 pass
- Full Vite build — not verified in packaging sandbox because dependency installation timed out.

No environment values were changed or included.
