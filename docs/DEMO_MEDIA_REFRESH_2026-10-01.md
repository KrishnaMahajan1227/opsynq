# Demo Media Refresh — 2026-10-01

## What was refreshed

This package refreshes the beneficiary field-photo set for **5 farmer records** using realistic irrigation / solar farming imagery suitable for demo usage.

Updated beneficiary media bundles:

1. **OPS-DM-004 — Ramesh Atram**
   - beneficiary photo
   - survey-site photo
   - water-source photo
   - installation before / during / after / overview
   - final beneficiary photo
   - service photo
   - LR photo

2. **OPS-DM-005 — Savita Dhoble**
   - beneficiary photo
   - survey-site photo
   - water-source photo
   - installation before / during / after / overview
   - final beneficiary photo
   - service photo
   - LR photo

3. **OPS-DM-006 — Dilip Khandekar**
   - beneficiary photo
   - survey-site photo
   - water-source photo
   - installation before / during / after / overview
   - final beneficiary photo
   - service photo
   - LR photo

4. **OPS-DM-015 — Sunanda Raut**
   - beneficiary photo
   - survey-site photo
   - water-source photo
   - installation before / during / after / overview
   - final beneficiary photo
   - service photo
   - LR photo

5. **OPS-DM-016 — Arun Shende**
   - beneficiary photo
   - survey-site photo
   - water-source photo
   - installation before / during / after / overview
   - final beneficiary photo
   - service photo
   - LR photo

Additional aligned entity evidence assets were also refreshed so demo evidence/service panels stay visually consistent.

## Source location

All refreshed files are bundled under:

`services/api/demo-media`

The demo seed already points to these beneficiary-specific filenames, so no schema or route changes are required.

## Reset / reseed commands

Use Node.js `>=22.20.0 <25`.

```bash
npm ci
cp services/api/.env.example services/api/.env
```

Then fill `services/api/.env` and ensure the database is a **demo/dev** database only.

Required guard values before destructive reset:

```env
OPSYNQ_DB_PURPOSE=demo
OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET=YES
```

Then run:

```bash
npm run demo:db-check
npm run demo:backup
npm run demo:wipe
npm run demo:seed
npm run demo:sanity
```

Or the guarded all-in-one flow:

```bash
npm run demo:reset
```

Then start the app:

```bash
npm run backend
npm run frontend
```

## Validation

Recommended quick checks after reseed:

```bash
npm run qa:demo-seed
npm run qa:beneficiary-material
npm run qa:agency-production-flow
npm run qa:excel-import
```

## Important note

Do **not** run wipe/reset on production or on any Atlas database that is not independently verified as demo/dev.
