# Phase 53 — Geo loading and integrated receiving scan

- Replaced runtime string lazy imports with statically analyzable Vite import callbacks; Geo Operations now builds as a real production chunk.
- Removed the duplicated Dashboard Action Center panel while keeping the governed Action Center route available where needed.
- Removed the standalone Barcode / Serial Scan navigation surface.
- Integrated serial/barcode capture into Goods Receipt lines with hardware-scanner input, manual entry, capability-aware camera scan, duplicate protection, and known-serial lookup.
- Selecting a purchase order in GRN prefills outstanding PO lines and destination warehouse.
- No schema migration or new runtime dependency.
