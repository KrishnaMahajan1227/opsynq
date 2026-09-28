# New Platform Schema Catalog

- Organization — PLATFORM / COMPANY / AGENCY / SUPPLIER / OEM / logistics and inspection partners
- PlatformUser — Platform Superadmin and Company roles
- Program — scheme/program/project-level configuration
- WorkOrder — contract / LOA / work order
- WorkPackage — agency-assignable execution package
- BeneficiaryContext — maps existing Farmer records to the new hierarchy
- ItemMaster — procurement and inventory master
- Warehouse — stock locations
- InventorySerial — serial/barcode-tracked physical assets
- StockMovement — auditable material movement
- Driver — driver master and last location
- Vehicle — vehicle master
- Shipment — dispatch/trip foundation and secure tracking-token fields
- ImportBatch — bulk Excel processing metadata and row outcomes
- AuditLog — sensitive change history

Existing validated schemas remain under `services/api/models`.

## Phase 5 additions

### InstalledAsset
Canonical beneficiary-level installed asset registry. Preserves original serial history across replacement/removal.

### AssetLifecycleEvent
Append-style event history for install, replace, return, damage, removal and future service events.

### ItemMaster.installationRole
Optional non-breaking field used to map inventory items to Pump/Motor/Controller/Panel installation fields. Existing records default to `NONE`.
