# OPSYNQ Final Finance + Company Dashboard Demo Update

## What changed

- Company Owner/Admin dashboard keeps the existing execution priority order, then adds:
  - Commercial Position
  - Agency Commercial Exposure
  - Supply Intelligence
  - Procurement & Working Capital
- Claims & Receivables now shows a top-level commercial summary:
  - Gross claimed
  - Eligible
  - Approved
  - Paid
  - Receivable
  - Blocked
- Claim detail now shows Ready / Submitted / Approved / Paid timestamps.
- SKEPL demo commercial story now contains four governed claim scenarios:
  - CLM-SKEPL-001 — SUBMITTED (Nagpur)
  - CLM-SKEPL-002 — PAID (Haryana / HRYOPS / OPS-HR-028 + OPS-HR-029)
  - CLM-SKEPL-003 — PARTIALLY_APPROVED with paid + receivable + blocked value
  - CLM-SKEPL-004 — READY (Haryana next milestone packet)
- Demo sanity verifies the finance lifecycle and Haryana claim lineage.
- `demo:finance-refresh` updates only the demo claims and does not wipe beneficiaries, inventory, RMS, media or protected accounts.

## Recommended update on an already seeded 29-beneficiary demo DB

Stop running frontend/backend processes, merge this ZIP into the project root, preserve the existing `.env` files, then run:

```powershell
cd D:\Opsynq
$env:OPSYNQ_DB_PURPOSE="demo"
npm run demo:finance-refresh
npm run demo:sanity
npm run qa:finance-demo
```

Then start:

```powershell
npm run backend
```

Second terminal:

```powershell
cd D:\Opsynq
npm run frontend
```

## Full clean demo rebuild (only if the existing demo hierarchy is not present/healthy)

```powershell
cd D:\Opsynq
$env:OPSYNQ_DB_PURPOSE="demo"
$env:OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET="YES"
npm run demo:reset
```

## Client demo path

1. Company Dashboard — show execution/RMS/state position first.
2. Scroll to Commercial Position — explain approved, paid, receivable and blocked value.
3. Agency Commercial Exposure — drill Haryana/Nagpur agency claims.
4. Finance & Assurance > Claims & Receivables — show the four lifecycle scenarios.
5. Open CLM-SKEPL-002 — Haryana paid claim linked to HRYOPS and fully completed Haryana sites.
6. Open CLM-SKEPL-003 — demonstrate partial approval, paid value, receivable and blocked reason.
7. Finance & Assurance > Financial Control — show procurement commitment, receipts, inventory book value, receivables and Agency exposure.
8. Quality & Compliance — demonstrate why fully verified/closed installations become claim-ready.

## Git

```bash
git status
git add .
git commit -m "feat: finalize finance demo lifecycle and executive company dashboard"
git push
```
