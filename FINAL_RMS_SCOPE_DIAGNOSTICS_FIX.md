# Final RMS Scope + Diagnostics Fix

## Root cause fixed
Company/Agency/Technician RMS authorization stores scoped IDs as strings. Normal Mongoose `find/countDocuments` queries cast those IDs automatically, but MongoDB aggregation `$match` does not. RMS overview totals and beneficiary-device grouping used aggregation pipelines, so alerts/providers could appear while device/current-state totals incorrectly showed zero.

The RMS controller now converts authorized company, agency and technician beneficiary IDs to MongoDB `ObjectId` values before those filters are used. The same scope object continues to be used for tenant isolation, so this is a type-correctness fix rather than a relaxation of access control.

## User-facing RMS improvements
- Company Overview KPIs drill into the matching RMS workspace.
- Recent alert rows open the exact device/beneficiary details.
- Live Assets shows the active issue and affected subsystem.
- Alert Center shows the affected subsystem and a direct `View device` action.
- Device Health rows drill into the exact RMS device.
- Device details show current telemetry, alert history, telemetry timeline, installed Pump/Motor/Controller/Panel serials, and signal-based subsystem diagnosis.
- Agency and Technician RMS use the same scoped API and show the same subsystem diagnosis and installed component context.
- Browser RMS cache key is versioned so an older cached zero summary is not reused after this fix.

## Diagnostic interpretation
The system does not falsely claim physical hardware failure when RMS telemetry cannot prove it. It presents a probable subsystem and recommended checks:
- `DRY_RUN` -> Pump / Motor / Water source
- `CONTROLLER_FAULT` -> Controller / Inverter
- `LOW_PERFORMANCE` -> Solar array / Controller / Pump train
- `COMMUNICATION_LOST` -> RMS / Controller communication
- `LOCATION_MISMATCH` -> RMS GPS / Installed location

Physical failure must still be confirmed in the field before replacement.

## Existing demo DB
No seed/reset is required if the 29-beneficiary demo and RMS prime already passed. After merging the project, restart the backend and hard-refresh the browser. The existing 29-device telemetry/current-state data will be read correctly by the fixed aggregation scope.

Recommended validation:

```powershell
cd D:\Opsynq
npm run qa:final-dashboard
npm run qa:rms-final
npm run qa:source
```

If RMS data itself was never primed, run once:

```powershell
$env:OPSYNQ_DB_PURPOSE="demo"
npm run demo:rms-prime
npm run demo:sanity
```
