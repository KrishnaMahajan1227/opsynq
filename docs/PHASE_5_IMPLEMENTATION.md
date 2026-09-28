# Opsynq Phase 5 — Field Asset Close-Loop

## Objective
Close the physical inventory loop from technician issue to beneficiary installation without rewriting the validated Agency Operations workflow.

## Delivered

### Technician installation + issued inventory
- Agency installation modal loads serialized material issued to the logged-in technician for the mapped farmer/work package.
- One-tap `Use` fills Pump, Motor, Controller and Panel serial fields.
- Backend independently validates tenant, agency, technician custody, serialized item role and duplicate installation state.
- Legacy farmers without Opsynq `BeneficiaryContext` keep the existing installation behavior.

### Installed Asset Register
New `InstalledAsset` records bind:
- Company
- Agency
- Farmer
- Work package
- Technician
- Item master
- Inventory serial
- Installation role
- Installation date
- Warranty dates
- Lifecycle state

Inventory serial state closes from `ISSUED` to `INSTALLED` and a stock movement of type `INSTALL` is recorded.

### Item installation role
`ItemMaster.installationRole` is an optional new field:
- NONE
- PUMP
- MOTOR
- CONTROLLER
- PANEL
- OTHER

Existing items default to `NONE`; no migration is required. Category/name inference remains as a compatibility fallback.

### Asset lifecycle
Company workspace now includes:
- Installed Assets
- Asset Lifecycle
- Asset detail timeline
- Unused issued-material return
- Damage marking
- Installed asset replacement
- Warranty-expiry visibility

Replacement preserves the original asset record and links the replacement instead of overwriting history.

### Technician issue reconciliation
Material issue records reconcile as serial custody changes:
- ISSUED
- PARTIALLY_RETURNED
- RETURNED
- CONSUMED

### Shipment receipt / POD reconciliation
Shipment receipt is no longer a blind one-click action.
It captures:
- Receiver name/mobile
- Delivery notes
- Good quantity
- Damaged quantity
- Missing quantity
- Exact serial/barcode values for serialized items
- POD photo
- Receiver signature photo

Partial receipts remain `PARTIAL`; unaccounted stock remains in transit. Damaged and missing serialized assets are moved into exception states.

## Backward compatibility
The existing Farmer, User, Survey, Installation, Complaint and Agency role schemas were not structurally renamed or rewritten.

For legacy farmers without a global mapping, Phase 5 inventory enforcement is intentionally skipped so the validated existing client workflow does not break.

## Environment
No `.env` file was added or modified in this phase.
No new npm dependency was introduced.
