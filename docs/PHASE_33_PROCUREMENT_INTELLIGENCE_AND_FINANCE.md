# Phase 33 — Procurement Intelligence, Agency Material Accountability & Financial Control

Phase 33 adds a management and decision layer on top of Opsynq's existing physical inventory chain. The physical source of truth remains PO → GRN → warehouse → shipment → Agency receipt → technician issue → installation.

## Procurement Intelligence

The replenishment engine evaluates warehouse/item positions using:

- current on-hand stock
- stock already in transit
- remaining quantity on open purchase orders
- Item Master minimum stock and reorder level
- recent 30-day outward consumption
- latest known supplier, unit cost, tax and observed lead time

It classifies risks as Warning, Critical or Out of Stock, calculates days of cover and a recommended reorder quantity, and targets notifications to Company Owner/Admin, Inventory Manager and Procurement Manager.

### Human-in-the-loop purchasing

Opsynq may automatically prepare a **Draft Purchase Order** for a replenishment risk. It does not issue the order automatically. Every new PO, including manually created POs, begins as Draft. Before issuance an authorized user must confirm:

- supplier
- destination warehouse
- item and quantity
- positive unit price
- tax and expected date as applicable

Only then can the user explicitly issue the PO. This prevents AI/rules from committing company funds without human approval.

## Optional decision service assistance

If a supported decision service/external decision service API key already exists in the backend environment, Opsynq can generate concise procurement and finance briefs. The API key is never sent to the frontend. Deterministic stock calculations remain the source of truth; decision service only explains/prioritizes supplied facts. If decision service is unavailable, Opsynq returns a rules-based brief.

## Agency Material Control

Company users can see, per Agency:

- quantity dispatched
- good quantity received
- quantity still pending accountability
- damaged quantity
- missing quantity
- receipt percentage
- in-transit, partial and delivered shipment counts

Agency Admin/Superadmin now have **Material Receipts** in Agency Operations. They can confirm good, damaged and missing quantities and, for serialized material, the corresponding serial/barcode values. Successful receipt moves accepted serials to `AGENCY_STOCK`, updates balances and stock movements, creates audit records and notifies relevant Company roles.

## Procurement / GRN integrity

GRN processing validates the complete request before inventory mutation:

- PO exists
- PO is Issued or Partially Received
- receiving warehouse matches the PO destination
- received item exists on the PO
- quantity does not exceed PO balance
- serialized items include exactly the required unique serials/barcodes

## Financial Control

Financial Control is an **operational management view**, not a statutory accounting general ledger. It consolidates:

- PO ordered value
- goods received value
- remaining procurement commitment
- estimated on-hand inventory value using latest known purchase cost
- inventory pricing coverage / unpriced lines
- claim gross / eligible / approved / paid / blocked values
- approved-but-unpaid receivable
- Agency-wise material sent/received value
- Agency-wise claim realization and blocked exposure

The UI explicitly shows pricing coverage so estimated stock value is not presented with false precision when cost history is incomplete.

## Automation

The scheduler includes `procurement_replenishment`. It refreshes risk positions, resolves recovered positions, creates targeted notifications and can prepare Draft POs. Action Center and Automation & Health expose critical/out-of-stock positions.

## Demo

`npm run seed:full-demo` now includes stockout/low-stock consumption patterns, historic purchase costs, multiple commercial claim states and an immediate replenishment scan so Procurement Intelligence, Financial Control and stock alerts are populated for demonstrations.
