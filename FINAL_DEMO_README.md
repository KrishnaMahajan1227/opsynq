# SOLARIZE / SRIF final demo package

This ZIP is intended to be copied/merged into the existing project root. Keep the already-working private `.env` files unchanged. Real `.env` files are intentionally not included.

## Demo data now included

- 19 beneficiaries total.
- Lifecycle split: 3 NEW, 3 SURVEY, 5 PROCESSING, 6 COMPLETED/CLOSED, 1 ON_HOLD, 1 REJECTED.
- Existing demo/SuperAdmin accounts are required and are not created, deleted, reset, or password-modified by the demo seed.
- Four media-rich records use the packaged photorealistic AI-generated demo images.

### Fully cleared record

`OPS-DM-019 — Madhukar Zade` is the end-to-end success record for client demonstration.

It is seeded with:
- Company: existing SKEPL tenant.
- Agency: existing Nagpur agency.
- Technician: `nagpur.tech01`.
- Survey: completed.
- Application: `Closed`.
- Material issue: `MI-NAG-005`, status `CONSUMED`.
- Installed serials: `P5-NAG-008`, `M5-NAG-008`, `C1-NAG-008`, `PNL-NAG-011`.
- Installed assets: 4 active serialized assets.
- Required evidence: all five configured stage requirements are `VERIFIED` across SURVEY, INSTALLATION and FINAL_INSPECTION.
- Final inspection: `CMPREC-019`, status `PASS`, with all checklist items `PASS`.
- Tenant-scoped audit trail: registration, survey, material stage, installation completion.
- Documents: demo consent and fictional SAMPLE/DEMO identity evidence linked through Cloudinary.

## Images

The package has 33 governed image slots across these records:
- `OPS-DM-001`: 2
- `OPS-DM-003`: 7
- `OPS-DM-014`: 10
- `OPS-DM-019`: 14

`OPS-DM-019` uses only images already generated in this project conversation. Ten source photographs are used; a few logical final-stage slots intentionally reuse a suitable source photograph (for example water-discharge proof as commissioning evidence). They remain separately linked under the `OPS-DM-019` Cloudinary namespace.

These are photorealistic AI-generated DEMO images, not photographs of real beneficiaries. Identity/document images are fictional demo material.

## Safe first seed (PowerShell)

```powershell
npm ci
$env:OPSYNQ_DB_PURPOSE="demo"
npm run demo:db-check
npm run demo:seed-ready
```

`demo:seed-ready` performs:
1. read-only DB preflight,
2. Cloudinary image upload and URL verification,
3. demo seed,
4. post-seed integrity/sanity verification.

Start the application:

```powershell
npm run backend
```

In a second terminal:

```powershell
npm run frontend
```

## If the demo data was already seeded before this 19-record version

The normal seed intentionally requires a clean demo business-data state. To replace an older demo seed, use the guarded reset only after confirming this is your demo/dev database:

```powershell
$env:OPSYNQ_DB_PURPOSE="demo"
$env:OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET="YES"
npm run demo:reset
```

This runs the project's guarded backup/wipe workflow before uploading media and reseeding. Do not use it against production.

## Source QA

```powershell
npm run qa:demo-seed
node scripts/phase29-contracts.js
```

## Git

After the app and seeded data have been checked in your environment:

```bash
git status
git add .
git commit -m "feat: add fully cleared SRIF demo beneficiary and evidence"
git push
```

## Verification limitation

Live MongoDB, Cloudinary upload and remote image URL reachability are not verified in the packaging runtime. The supplied `demo:db-check`, `demo:media:upload` and `demo:sanity` commands perform those environment-specific checks.


## Reset race-condition fix (RMS auto-bootstrap)
If the API/frontend is still running during `demo:reset`, RMS dashboard polling can auto-create the demo RMS provider/rule documents after wipe and before seed. This package now detects that narrow state during an explicitly authorized destructive reset and removes only the known `DEMO-RMS` / `DEMO_SIMULATOR` bootstrap documents for protected demo companies. Any unknown provider, unrelated rule, or any other non-protected collection still blocks the seed.

If a previous reset stopped after media upload with only `rmsproviders=1,rmsruleconfigs=1`, keep `OPSYNQ_DB_PURPOSE=demo` and `OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET=YES`, stop any running backend/frontends for a clean recovery, then run:

```powershell
npm run demo:seed
npm run demo:sanity
```

The existing `services/api/demo-media/cloudinary-manifest.json` is reused; images do not need to be uploaded again.
