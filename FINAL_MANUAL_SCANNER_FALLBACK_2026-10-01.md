# OPSYNQ Manual Scanner Fallback

All governed scanner surfaces now retain a manual fallback.

- Company GRN: scan, camera, single manual entry, or bulk paste serial/barcode lists.
- Agency inbound receipt: scan/camera/manual single code plus Good/Damaged/Missing bulk manual lists.
- Technician beneficiary receipt: scan/camera/manual single code plus validated bulk serial/barcode paste.
- Solar panels at technician receipt: dedicated manual bulk panel list with PANEL role validation.
- Installation/rework: scan/camera/manual single code plus validated bulk list.
- Solar panels at installation: dedicated manual bulk panel list and second-stage beneficiary receipt validation.

Manual input never bypasses inventory governance. Codes are validated against Company/Agency/technician/beneficiary custody and role rules before acceptance.
