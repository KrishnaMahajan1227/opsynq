# Target Architecture

Platform Superadmin
→ Company
→ Program / Project
→ Contract / LOA / Work Order
→ Work Package
→ Agency
→ Existing Agency Operations
→ Farmer
→ Survey
→ Installation
→ Final Inspection
→ Completion
→ Complaint / Warranty / Service

Parallel Company modules:
- Procurement
- Item Master
- Warehouses
- Inventory / serial tracking
- Barcode / QR scanning
- Logistics / drivers / vehicles / shipments
- Live maps
- SLA / delays
- Finance / claims
- Audit and bulk imports

## Existing Agency layer
The existing Farmer, User, verification, installation, complaint, location and Excel flows are retained as the operational engine.

## Multi-tenancy
New records are scoped through company / organization / program / work package references. Server-side authorization must enforce these scopes. UI filtering alone is never sufficient.

## Beneficiary integration
`BeneficiaryContext` links an existing Farmer to Company, Program, WorkOrder, WorkPackage and Agency without changing the existing Farmer schema.
