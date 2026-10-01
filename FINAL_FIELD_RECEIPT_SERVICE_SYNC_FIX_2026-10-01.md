# OPSYNQ field receipt, service stability and sync hardening

## Fixed
- Technician order receipt now loads governed issued inventory for the current beneficiary/technician.
- Beneficiary-bound serialized material pre-fills Pump/Motor/Controller/Panels; work-package stock must be scanned before attaching it to the beneficiary.
- Receipt scanner supports typed/USB/Bluetooth scanner input and camera BarcodeDetector where supported, with server-side beneficiary/technician validation.
- Installation still re-validates the same serialized inventory before asset creation, preventing duplicate/wrong-owner/already-installed serial use.
- Signature conversion no longer calls fetch(data:...), removing the reported CSP failure.
- Farmer upload errors now return structured 400/413/502 responses rather than falling through as vague 500s.
- RMS dashboard GET/read paths no longer advance demo telemetry or create incidents as a side effect.
- RMS critical incidents reuse an unresolved logical ServiceCase; dashboard/list responses collapse legacy duplicate active RMS incidents.
- Agency beneficiary list backfills Assigned vendor/company from BeneficiaryContext company ownership when the legacy Farmer field is blank.
- Agency workspace top spacing/header alignment tightened.
- Company and Agency apps expose a non-blocking global request progress bar while keeping the current UI interactive/stable.

## Verification
1. Technician > Installation > Confirm receipt: beneficiary-bound material should prefill, then scan a serial and confirm it is validated.
2. Open Company Dashboard repeatedly for several minutes: Open Service Cases must remain stable unless a real/new incident is created.
3. Agency > Beneficiary Records: newly imported beneficiaries should show their owning Company instead of a dash where context exists.
4. Save Farmer/Technician signatures in receipt flow: no CSP data:image connect-src error should appear.
