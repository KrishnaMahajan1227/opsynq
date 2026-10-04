# Final RMS + Agency UI last fix

## What changed

- Demo RMS now reconciles one canonical RMS device for every beneficiary context in the demo company, not only the installed-asset subset.
- Early-stage beneficiaries receive STANDBY demo telemetry with non-zero cumulative energy/runtime/water values; processing/completed beneficiaries receive operating telemetry.
- Deliberate communication-loss, dry-run and low-performance examples remain available.
- Device list APIs fall back to the latest persisted telemetry when current-state materialization is temporarily missing.
- Company and Agency RMS listings now show per-device daily output (energy, runtime and water) in addition to power/state.
- RMS device details include energy, runtime, flow, water discharge and timestamps.
- Agency backoffice no longer reserves the hidden navbar's 54px at the top; the sidebar starts at the viewport top and workspace spacing is compact.
- Agency Bootstrap/action button variants are normalized to the existing neutral/green design system with readable text contrast.

## Existing healthy 29-record demo DB (recommended)

Stop backend/frontend processes, merge this project, preserve your existing real `.env` files, then run:

```powershell
cd D:\Opsynq
$env:OPSYNQ_DB_PURPOSE="demo"
npm run demo:rms-prime
npm run demo:sanity
npm run qa:final-dashboard
npm run qa:source
```

Start apps:

```powershell
npm run backend
```

Second terminal:

```powershell
cd D:\Opsynq
npm run frontend
```

## Clean demo rebuild only when intentionally required

```powershell
cd D:\Opsynq
$env:OPSYNQ_DB_PURPOSE="demo"
$env:OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET="YES"
npm run demo:reset
```

## Expected RMS demo behavior

- Each seeded beneficiary context has one demo RMS device.
- Live Assets shows beneficiary, device, pump state, power, energy today, runtime today, water discharge, connectivity, health and timestamps.
- Overview/Performance totals are derived from current state, with persisted telemetry fallback for the demo provider.
- Communication-loss example remains offline/stale with its prior cumulative readings visible.
- Agency and Technician RMS remain tenant/assignment scoped.

## Verification performed in delivery environment

- `npm run qa:source` — PASS.
- `npm run qa:rms-final` — PASS.
- `npm run qa:final-dashboard` — PASS.
- Frontend JSX syntax parser — PASS (80 files).
- Backend modified files syntax — PASS.
- Production Vite build — not verified in delivery environment because `node_modules` is intentionally absent; run `npm ci` then `npm run build:all` on the target machine if desired.
