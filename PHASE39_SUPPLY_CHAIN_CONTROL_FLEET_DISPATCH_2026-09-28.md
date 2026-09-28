# Phase 39 — Supply Chain Control, Fleet & Dispatch Operations

## Objective
Turn procurement, inventory, dispatch, agency receipt and field custody into one connected company operating model instead of separate flat screens.

## Information architecture
The Company navigation now exposes one **Supply Chain Control** entry. Operational screens remain routable/searchable and open as drill-down workspaces:

1. Procurement & Receiving
   - Purchase Orders & GRN
   - Procurement Intelligence
   - PDI & Asset Inspection
2. Inventory & Warehousing
   - Item Master
   - Warehouses
   - Warehouse Stock & Transfers
   - Barcode / Serial Scan
3. Dispatch & Delivery
   - Dispatch & Shipment Tracking
   - Drivers & Vehicles
   - Dispatch Overview
4. Agency & Field Custody
   - Agency Material Accountability
   - Technician Material Custody
   - Installed Assets
   - Reconciliation

Breadcrumbs keep `Workspace → Supply Chain Control → Current screen` while internal pages keep Supply Chain Control active in the sidebar.

## Dispatch and fleet control
- Driver and vehicle masters support create, edit and safe archive.
- Fleet lists are paginated and searchable.
- Availability is calculated from live shipment workload and can be filtered server-side.
- Driver/vehicle detail shows active workload, 30-day deliveries, next ETA and shipment history.
- Dispatch creation/edit supports Work Package, Agency, driver, vehicle, planned departure, ETA, priority, route notes and issue flag/note.
- Driver/vehicle assignment lists show live workload so free resources are visible first.
- Dispatching is blocked if the assigned driver or vehicle is already on another moving shipment, or is off-duty/maintenance/inactive.
- Shipment rows open full dispatch context and receipt details.
- Bulk shipment controls support safe assignment, priority changes and draft cancellation with a maximum batch size of 100.

## Procurement and inventory controls
- Purchase Orders are paginated/searchable/filterable and retain edit/cancel/GRN workflows.
- Safe bulk cancellation skips received/locked POs.
- Item Master supports create, edit, Excel bulk import and archive.
- Item archive is blocked while stock, open procurement or active dispatch references remain.
- Warehouses support create, edit and safe archive; archive is blocked while stock/in-transit quantities remain.
- Stock remains server-paginated with warehouse/item/search filters and controlled transfer workflow.

## Agency and field accountability
- Supply Chain Control shows agency-wise dispatched/received/exception footprint.
- Agency Material Accountability shows shipment, receipt, damage/missing, agency stock and technician-issued quantities.
- Agency dispatch rows open the matching Dispatch & Shipment record.
- Technician custody rows open the matching Material Issue record, with beneficiary links where available.
- Agency inbound receipt workflow remains the authoritative company→agency hand-off; technician issue/install continues the same custody chain.

## Scale and UX
- Operational lists use server pagination (typically 25 rows; APIs cap at 100/page).
- Search/filter state can be passed from control-tower folders/cards into the target workspace.
- Control-tower summaries use MongoDB aggregation/map-based workload calculations rather than rendering large raw datasets.
- Clickable rows open details/actions instead of expanding every record inline.
- Semantic status colors are retained; navigation/folders use restrained enterprise styling.

## Destructive data policy
Historical procurement, receipt, shipment, custody and installation records are not hard-deleted because they are audit/custody evidence. Safe lifecycle actions are used instead: cancel draft, archive unused master data, reconcile received/in-transit stock, or return/damage serialized material.
