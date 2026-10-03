# Final Client Demo Readiness

## What changed in this final pass

- RMS demo topology normalized to one canonical RMS system/controller device per beneficiary instead of one RMS device per installed component.
- Demo RMS now has a persisted multi-reading telemetry timeline and advances through the normal ingestion pipeline at most once every 30 seconds while RMS screens are in use.
- Decommissioned devices do not emit fresh telemetry; communication-loss demo devices remain silent and become offline/stale through the normal freshness rules.
- Company, Agency and Technician RMS views expose exact RMS device ID/serial, beneficiary, technician, current state, telemetry timestamp, receipt timestamp, data age, electrical/operational readings, alert history and detailed telemetry timeline.
- RMS reset flow now primes the simulator before sanity verification so the first client click does not need to bootstrap demo RMS data.
- Responsive hardening added for phones, tablets, small laptops, desktops, projector/TV widths: dense tables scroll within their container, action/filter bars collapse safely, drawers/modals stay in viewport, long identifiers wrap safely, and operational grids reduce columns at smaller breakpoints.
- Removed stale duplicate frontend permission module and unused legacy Agency login page; the unified login remains the single user-facing login.
- Restored placeholder-only `.env.example` files for API, Company web and Agency web.
- Updated stale QA contracts to the current Agency Operations naming and current geo-evidence/media layout.

## Demo dataset

- 29 beneficiaries total across Maharashtra and Haryana.
- Existing accounts/tenant mappings remain protected by the reset/seed guard.
- 56 governed demo image slots remain packaged and linked by the existing Cloudinary upload flow.
- Existing inventory bulk scan/manual receiving and governed delete flows are retained.

## Recommended clean demo refresh

Stop all running backend/frontend Node processes first. Keep your existing working `.env` files unchanged.

```powershell
cd D:\Opsynq
npm ci
$env:OPSYNQ_DB_PURPOSE="demo"
$env:OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET="YES"
npm run demo:reset
```

The reset sequence is now:

`backup -> wipe -> media upload -> seed -> RMS prime -> sanity`

Run source/regression QA:

```powershell
npm run qa:source
npm run qa:rms-final
node scripts/final-rms-haryana-regression.js
node scripts/inventory-bulk-unit-regression.js
node scripts/delete-governance-regression.js
```

Run application:

```powershell
npm run backend
```

In a second terminal:

```powershell
cd D:\Opsynq
npm run frontend
```

## Git

After the reset/sanity and browser walkthrough are successful:

```bash
git status
git add .
git commit -m "feat: finalize realtime RMS observability and responsive demo readiness"
git push
```

## Verification status in packaging environment

Passed:
- full `npm run qa:source`
- RMS realtime/responsive regression
- route contracts
- centralized permissions
- role navigation
- dashboard performance contracts
- Haryana/RMS regression
- inventory bulk scan/manual receiving regression
- delete governance regression
- backend syntax checks
- frontend JSX syntax checks

Not verified in the packaging sandbox:
- Vite production bundle, because dependency installation did not complete within the sandbox execution window.
- Live MongoDB/Cloudinary reset for this newest package. `npm run demo:reset` performs those checks in the user's configured demo environment.
- Pixel-by-pixel rendering on every physical device/projector/TV. Responsive code paths and viewport contracts were audited and hardened, but physical-device visual QA remains environment-dependent.
