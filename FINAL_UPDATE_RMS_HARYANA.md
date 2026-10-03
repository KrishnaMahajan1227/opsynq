# Final Demo Update — RMS + Agency Operations + Haryana

## Included
- Program Delivery renamed to Agency Operations.
- Agency Performance moved under Agency Operations (not Finance & Assurance).
- Company dashboard Survey Health card replaced with Agency Performance snapshot; survey coverage remains inside Agency Performance.
- Company RMS Device Health lists exact offline/stale/disabled devices with beneficiary, agency, device/serial, connectivity, health and operational state.
- Agency and Technician RMS use the same tenant/assignment-scoped Offline + disabled / Offline / Disabled filters.
- RMS alerts identify the exact RMS device ID and serial alongside beneficiary, technician and issue message.
- Demo RMS simulator produces deterministic examples for communication loss, dry-run/low-performance alerting and a disabled/decommissioned device.
- Existing inventory bulk scan/manual receipt + governed delete update retained.
- 10 Haryana beneficiaries added under a separate Haryana PM-KUSUM program/LOA/work order/work package while remaining inside the existing SKEPL tenant and existing NAGFOPS agency/technician mapping.
- Haryana districts represented: Karnal, Panipat, Kurukshetra, Kaithal, Sonipat, Hisar and Rohtak.
- OPS-HR-029 is closed/commissioned with consumed material issue, installed serialized assets, governed evidence and final compliance PASS.
- Selected Haryana demo records reuse the project's existing AI-generated demo photographs. They are demo-only media, not real beneficiary photographs.

## Demo data after reset
- Total beneficiaries: 29
- Maharashtra: 19
- Haryana: 10
- Lifecycle: NEW 5 / SURVEY 5 / PROCESSING 10 / COMPLETED 7 / ON_HOLD 1 / REJECTED 1
- Media-rich records: 7
- Governed Cloudinary media slots: 56

## Required reset from the previous 19-record database
The existing database already contains the older 19-record demo. Use the guarded demo reset so the Haryana program and media are seeded consistently.

PowerShell:

```powershell
cd D:\Opsynq
$env:OPSYNQ_DB_PURPOSE="demo"
$env:OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET="YES"
npm run demo:reset
```

Then:

```powershell
npm run demo:sanity
npm run backend
```

Second terminal:

```powershell
cd D:\Opsynq
npm run frontend
```

## Source QA executed in packaging runtime
- frontend JSX parser: pass (82 JS/JSX files)
- final RMS + Haryana regression: pass
- demo seed/media source contracts: pass
- role navigation contracts: pass
- agency performance/finance contracts: pass
- dashboard performance contracts: pass
- inventory bulk unit regression: pass
- delete governance regression: pass

Live MongoDB reset/Cloudinary upload of the new Haryana media is not executed from this packaging runtime. `npm run demo:reset` performs those steps in the user's working environment.
