# Final Haryana Agency + Dashboard UI Demo Update

## What changed
- Company dashboard uses a professional 2-column executive layout: Execution Mix + Agency Performance, with State Execution full-width below.
- Haryana beneficiaries are no longer mapped to the Maharashtra/Nagpur agency.
- Dedicated Haryana agency: `HRYOPS` (Haryana Renewable Field Operations), under SKEPL.
- Dedicated Haryana field team: superadmin, admin, technician 01, technician 02.
- `OPS-HR-028` and `OPS-HR-029` are fully completed/closed demo records with installed serials, consumed material custody, governed evidence and PASS final inspection.
- Haryana RMS devices inherit the Haryana agency/technician mapping from installed assets/beneficiary ownership.
- Haryana media-rich records: OPS-HR-020, OPS-HR-024, OPS-HR-028, OPS-HR-029. Existing AI-generated demo media is reused under explicit governed duplicate rules.
- Demo reset now bootstraps/verifies the Haryana demo tenant before backup/wipe, then performs the complete reset pipeline.

## Important account behavior
`demo:haryana-bootstrap` creates the four Haryana demo accounts only if absent. It does not modify existing Maharashtra/Pune demo accounts. To avoid introducing a plaintext password or secret into source, each Haryana account receives the password hash of the equivalent existing Nagpur demo role. Therefore use the same existing demo password you already use for the corresponding Nagpur superadmin/admin/technician account.

## Recommended clean update
Stop all running backend/frontend Node processes before the reset.

```powershell
cd D:\Opsynq
npm ci

$env:OPSYNQ_DB_PURPOSE="demo"
$env:OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET="YES"

npm run demo:reset
```

`demo:reset` now runs:

1. Haryana tenant/account bootstrap/verification
2. DB backup
3. guarded demo wipe
4. Cloudinary media upload
5. Maharashtra + Haryana seed
6. RMS prime/history
7. full sanity verification

## Verification
```powershell
npm run qa:source
npm run qa:rms-final
node scripts/final-haryana-agency-ui-regression.js
node scripts/final-rms-haryana-regression.js
node scripts/demo-media-duplicate-regression.js
node scripts/inventory-bulk-unit-regression.js
node scripts/delete-governance-regression.js
```

## Run
Terminal 1:
```powershell
cd D:\Opsynq
npm run backend
```

Terminal 2:
```powershell
cd D:\Opsynq
npm run frontend
```

## Git
After browser verification:
```bash
git status
git add .
git commit -m "feat: finalize Haryana agency mapping and executive dashboard UI"
git push
```

## Expected Haryana demo
- State: Haryana
- Agency: HRYOPS
- Beneficiaries: 10
- Fully cleared records: OPS-HR-028, OPS-HR-029
- Agency technicians: haryana.tech01, haryana.tech02
- Company dashboard should show Haryana as 1 dedicated agency, not Nagpur agency coverage.
