# OPSYNQ — Beneficiary Material Custody Finalization

## Final governed flow

Company / Agency stock → MaterialIssue → Technician custody → Beneficiary physical receipt scan → BeneficiaryMaterialReceipt → Installation second scan → InstalledAsset / Complaint + Rework.

### Receipt checkpoint
- Expected beneficiary-issued serials are prefilled but are **not** treated as physically received.
- Technician must scan each received serialized item.
- Work-package scoped serials are bound to the beneficiary only after physical receipt scan.
- Full Set rejects missing/damaged expected items.
- Partial Set requires shortage/damage remarks.
- Damaged/missing serials update governed inventory state and stock movements.
- Receipt creates a revisioned beneficiary custody record and publishes Company progress.

### Installation checkpoint
- Receipt-confirmed GOOD serials are prefilled.
- Technician must re-scan the physical material at installation.
- Backend compares the second-scan set to the latest confirmed beneficiary receipt.
- Exact match → installation can complete and serials become InstalledAssets.
- Missing/unexpected/damaged material → installation cannot close normally; OPSYNQ creates/keeps a complaint and routes to rework.
- Replacement/rework material can be issued and received again; the new receipt supersedes the old receipt without losing complaint history.

### Visibility
Agency Beneficiary detail and Company Beneficiary 360 now show:
- Issued quantity
- Technician-received quantity
- Receipt number/status/time/technician
- Receipt serials by Pump/Motor/Controller/Panel/Other
- Good / Damaged / Missing status
- Installed quantity and reconciliation mismatch

### No migration
MongoDB creates the new BeneficiaryMaterialReceipt collection lazily. Existing Farmer, MaterialIssue, InventorySerial, StockMovement and InstalledAsset records remain compatible.
