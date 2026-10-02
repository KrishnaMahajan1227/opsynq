# Fresh SRIF demo seed — 2026-10-02

## Safety contract

- The fresh seed **does not create or reset credentials** and does not change existing account IDs, password hashes, roles or tenant mappings.
- `npm run demo:db-check` is read-only. It requires the exact protected SuperAdmin + demo account/tenant set and empty business collections; unexpected accounts, organizations, links or business data block the seed without deleting anything.
- Any database write requires `OPSYNQ_DB_PURPOSE` to be explicitly classified as `demo`, `dev` or `test`. Destructive reset additionally requires `OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET=YES`. Keep these as process/session safety flags; do not overwrite the supplied private `.env` values.
- Seed requires `services/api/demo-media/cloudinary-manifest.json`, produced only after all 58 required real JPGs upload successfully and their URLs return HTTP 200/206.

## Lifecycle distribution

Exactly 19 beneficiaries: 3 NEW, 3 SURVEY, 5 PROCESSING, 6 COMPLETED/CLOSED, 1 ON_HOLD, 1 REJECTED.

| ID | Beneficiary | Stage | Agency | Technician | Images |
|---|---|---|---|---|---:|
| OPS-DM-001 | Bharat Wankhede | NEW | NAGFOPS | nagpur.tech01 | 2 |
| OPS-DM-002 | Suresh Meshram | SURVEY — in progress | NAGFOPS | nagpur.tech02 | 0 |
| OPS-DM-003 | Lata Gaikwad | PROCESSING — ordered | NAGFOPS | nagpur.tech01 | 7 |
| OPS-DM-004 | Ramesh Atram | COMPLETED — installed | NAGFOPS | nagpur.tech01 | 0 |
| OPS-DM-005 | Savita Dhoble | COMPLETED — installed + service case | NAGFOPS | nagpur.tech02 | 17 |
| OPS-DM-006 | Dilip Khandekar | COMPLETED — closed | NASRINS | nashik.tech01 | 0 |
| OPS-DM-007 | Geeta Ahire | SURVEY — completed | NASRINS | nashik.tech01 | 6 |
| OPS-DM-008 | Mahesh Sonawane | PROCESSING — dispatched | NASRINS | nashik.tech02 | 0 |
| OPS-DM-009 | Shobha Chavan | NEW | PUNESVC | pune.tech01 | 0 |
| OPS-DM-010 | Vishal Jagtap | SURVEY — completed | PUNESVC | pune.tech01 | 0 |
| OPS-DM-011 | Anita More | PROCESSING — material issued | PUNESVC | pune.tech01 | 0 |
| OPS-DM-012 | Prakash Bawane | NEW | NAGFOPS | nagpur.tech02 | 0 |
| OPS-DM-013 | Meena Khobragade | PROCESSING — move to installation | NAGFOPS | nagpur.tech01 | 0 |
| OPS-DM-014 | Nitin Uikey | PROCESSING — installation in progress | NAGFOPS | nagpur.tech02 | 10 |
| OPS-DM-015 | Sunanda Raut | COMPLETED — installed | NAGFOPS | nagpur.tech01 | 0 |
| OPS-DM-016 | Arun Shende | COMPLETED — closed | NAGFOPS | nagpur.tech02 | 16 |
| OPS-DM-017 | Kalpana Pawar | ON_HOLD | NASRINS | nashik.tech01 | 0 |
| OPS-DM-018 | Ganesh Jadhav | REJECTED | NASRINS | nashik.tech02 | 0 |

## Real-media selection

- `OPS-DM-005` and `OPS-DM-016`: completed/closed full evidence sets; `OPS-DM-005` additionally demonstrates service/complaint evidence.
- `OPS-DM-003` and `OPS-DM-014`: processing-stage evidence only; `OPS-DM-014` reaches before/during/serial-plate installation evidence but not completion evidence.
- `OPS-DM-007`: completed survey evidence only.
- `OPS-DM-001`: new-registration portrait + redacted/purpose-built demo ID proof only.
- All other beneficiaries have empty media fields by design.

The exact 58 filenames and categories are in `services/api/demo-media/mapping.csv` and `FILE_TREE.txt`. Do not use real government-ID PII; photographed documents must be redacted/purpose-built demo documents.

## Commands

```powershell
npm ci
# Restore your existing private .env files unchanged; they are intentionally excluded from the delivery ZIP.
$env:OPSYNQ_DB_PURPOSE="demo"   # only after you personally confirm the target is the demo/dev DB
npm run demo:db-check
# Put the 58 distinct real JPGs into services/api/demo-media/... as listed in FILE_TREE.txt
npm run demo:seed-ready
```

`demo:seed-ready` runs: read-only DB check → Cloudinary media upload/reachability check → DB seed → automatic sanity.

For a later **re-run** of a populated demo database, make a fresh backup and enable the destructive guard only for that verified demo/dev session:

```powershell
$env:OPSYNQ_DB_PURPOSE="demo"
$env:OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET="YES"
npm run demo:reset
```

Run application in two terminals:

```powershell
npm run backend
```

```powershell
npm run frontend
```

## Verification coverage

`demoSanity.js` checks protected-account snapshot stability (when a reset backup exists), exact lifecycle counts, beneficiary/context orphans, Company→Agency tenancy, work-package quantities, agency mappings, duplicate serials, inventory balance reconciliation, material issue/stock ledger consistency, installed asset custody, exact six media-rich records, unique Cloudinary URLs/public IDs, HTTP reachability, and per-beneficiary audit logs.
