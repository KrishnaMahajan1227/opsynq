# Opsynq Demo Reset & QA — 2026-10-01

## What changed

The demo seed is now deterministic at exactly 18 beneficiaries, preserves existing demo/SuperAdmin identities and password hashes, and uses 329 unique bundled synthetic media assets. Database reset tooling now refuses destructive work unless the target is explicitly marked demo/dev/test, a matching backup exists, and the expected demo identities/tenants are present.

The QA pass also removed the unused legacy Agency login surface, restored the single unified sign-in contract, added explicit evidence submission provenance for Agency survey/install flows, and hardened AI behavior so provider/key/network failures return tenant-scoped deterministic briefs instead of breaking the demo screen.

## Database safety status

The attached private environment points to a remote MongoDB Atlas host and database name `OPSYNQ`. At review time `OPSYNQ_DB_PURPOSE` and `OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET` were unset. Therefore no destructive backup/wipe/seed cycle was executed against that remote database.

To run the reset, first independently verify that the configured target is an isolated demo/dev database. Then set:

```env
OPSYNQ_DB_PURPOSE=demo
OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET=YES
```

Never set those two values in production.

## Copy-paste command order

Use Node.js `>=22.20.0 <25` as declared by the project.

```bash
# 1) install
npm ci

# 2) environment
cp services/api/.env.example services/api/.env
# Fill the private values in services/api/.env.
# Preserve the existing SuperAdmin credentials.
# Confirm MONGO_URI is an isolated demo/dev DB, then set:
# OPSYNQ_DB_PURPOSE=demo
# OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET=YES

# 3) non-destructive DB target/account preflight
npm run demo:db-check

# 4) normal bootstrap/migration-equivalent setup used by this Mongoose project
npm run seed

# 5) protected backup
npm run demo:backup

# 6) wipe non-protected demo data only
npm run demo:wipe

# 7) fresh deterministic 18-beneficiary demo seed
npm run demo:seed

# 8) DB sanity checks: protected hashes/IDs, counts, links, serials, media, tenant lineage
npm run demo:sanity

# Alternative after preflight: backup -> wipe -> seed -> sanity in one guarded command
npm run demo:reset

# 9) run
npm run backend
npm run frontend

# 10) QA / tests
npm run qa:release
npm run uat:contracts
npm run qa:agency-production-flow
npm run qa:beneficiary-material
npm run qa:excel-import
npm run qa:map-refresh
npm run ai:doctor
npm run qa:build
```

This repository uses Mongoose rather than SQL migrations; the project’s existing bootstrap/schema-index flow is the migration-equivalent setup. The wipe is collection-aware and Mongo ObjectIds do not have SQL-style sequences to reset.

## Demo lifecycle set

| Beneficiary | Name | Area | Demo state |
|---|---|---|---|
| OPS-DM-001 | Bharat Wankhede | Wanadongri, Nagpur | New / survey pending |
| OPS-DM-002 | Suresh Meshram | Gumgaon, Nagpur | Survey in progress / ordered |
| OPS-DM-003 | Lata Gaikwad | Dhamna, Nagpur | Survey complete / ready for installation |
| OPS-DM-004 | Ramesh Atram | Kalmeshwar, Nagpur | Installation completed; installed serialized assets |
| OPS-DM-005 | Savita Dhoble | Kandri, Nagpur | Installed + complaint/service example |
| OPS-DM-006 | Dilip Khandekar | Nandur Shingote, Nashik | Closed; installed serialized assets |
| OPS-DM-007 | Geeta Ahire | Pangri, Nashik | Survey complete / pending installation |
| OPS-DM-008 | Mahesh Sonawane | Dubere, Nashik | Dispatch completed |
| OPS-DM-009 | Shobha Chavan | Morgaon, Pune | New / survey pending |
| OPS-DM-010 | Vishal Jagtap | Katewadi, Pune | Survey in progress / ordered |
| OPS-DM-011 | Anita More | Pandharewadi, Pune | Ready for installation; beneficiary material issued |
| OPS-DM-012 | Prakash Bawane | Isasani, Nagpur | Pending installation / consent exception |
| OPS-DM-013 | Meena Khobragade | Borgaon, Nagpur | Approved / move to installation |
| OPS-DM-014 | Nitin Uikey | Khapa, Nagpur | Dispatch completed / receipt exception example |
| OPS-DM-015 | Sunanda Raut | Yenwa, Nagpur | Installation completed; serialized assets |
| OPS-DM-016 | Arun Shende | Mansar, Nagpur | Closed; serialized assets |
| OPS-DM-017 | Kalpana Pawar | Musalgaon, Nashik | ON_HOLD edge case: land document pending |
| OPS-DM-018 | Ganesh Jadhav | Lasalgaon, Nashik | REJECTED edge case: water-source verification |

## QA results executed in this review

| Area | Result | Notes |
|---|---|---|
| Demo seed contracts | PASS | 18/18 beneficiary IDs, account preservation contract, tenant/technician mapping and 329 unique media checked. |
| Full source contracts | PASS | Backend syntax, role navigation, permissions, UX, tenancy, evidence, supply chain, AI, finance, dashboard and scale contracts passed after fixes. |
| API route contracts | PASS | Frontend/backend route mapping contract passed. |
| UAT architecture contracts | PASS | Readiness/data-quality architecture contract passed. |
| Agency production lifecycle | PASS | 13/13 source-level lifecycle/assignment/offline/notification contracts. |
| Beneficiary material custody | PASS | 18/18 receipt/serial/rescan/reconciliation contracts. |
| Excel import governance | PASS | 22/22 template, validation, duplicate, sample-row, extra-field and error-report contracts. |
| Map refresh regression | PASS | Tenant/background refresh and provider fallback source contracts passed. |
| AI adapter doctor | PARTIAL | Server AI credential is configured; provider could not be live-verified because the QA environment had outbound DNS/network failure. Graceful fallback path is implemented. |
| Fresh dependency install | NOT VERIFIED | `npm ci` could not complete in the QA container because npm registry DNS returned `EAI_AGAIN`. |
| Frontend production build from this modified source | NOT VERIFIED | Build dependencies could not be freshly installed in the QA container. Existing uploaded ZIP contained prior build artifacts, but those are not counted as verification of this modified source. |
| Remote DB backup/wipe/seed/sanity | NOT RUN | Deliberately blocked: current Atlas target was not explicitly proven demo/dev and destructive safety flags were unset. |
| Live role-by-role browser E2E against seeded DB | NOT VERIFIED | Requires verified demo DB + installed dependencies + running services. |
| Live CSV/XLSX/PDF export contents | NOT VERIFIED | Source/route/report contracts pass; live generated files need runtime DB verification. |
| Large-file import performance | NOT VERIFIED | Validation/governance contracts pass; no live large upload was executed here. |
| Browser console / visual responsive sweep | NOT VERIFIED | Source UX contracts pass; no browser automation environment was available in this review. |

## Bugs found and fixed

- Existing demo account seed/bootstrap paths re-hashed credentials on repeat runs. They now leave existing account `_id`, credential hash, role and tenant mapping untouched.
- Legacy hard-coded SuperAdmin creation contained a fixed credential path. First-create now requires private environment values; existing SuperAdmin remains untouched.
- Demo seed had 24 beneficiaries instead of the requested 18. It is now exactly 18, with 10/5/3 work-package quantities matching the data.
- Legacy Agency `Login.jsx` was still present despite unified sign-in; this broke the single-login release contract. The unused legacy login surface was removed.
- Duplicate dead permission modules with JSX-in-`.js` caused release-source failure. The app already uses `accessControl.jsx`; stale duplicates were removed.
- Agency survey evidence lacked an explicit submission provenance marker. Evidence now records `AGENCY_FIELD_SURVEY`, `AGENCY_FIELD_INSTALLATION`, `AGENCY_EVIDENCE_CHECKLIST` or `DEMO` source as applicable.
- Procurement AI used a separate less-resilient provider call. It now has current key compatibility, timeout, model fallback and structured failure states.
- Company/finance AI returned hard errors when AI was unavailable. It now returns deterministic tenant-scoped operational/finance summaries, with provider status, so the demo UI remains usable.
- Generic/reused demo media was replaced with 329 unique beneficiary/entity-specific synthetic assets and all seeded file links point to bundled paths.

## Known risks / demo cautions

- Do not run `demo:wipe` or `demo:reset` until `demo:db-check` passes on a separately verified demo/dev Atlas database. The guard is intentionally strict.
- Do not change or recreate existing demo users before the reset; the guard expects the known demo identities so their IDs/hashes/mappings can be preserved.
- The live AI provider itself was not reachable from this QA environment. The demo will stay functional through deterministic fallback, but a client-facing “live generated” response should be tested once on the actual demo machine/network.
- Run `npm ci` and `npm run qa:build` on the demo machine using the project-declared Node version before the meeting; this review environment used Node 22.16.0, below the project minimum 22.20.0.
- After dependencies are available and the DB is proven safe, run the full command sequence above and do one browser pass for all role logins before importing client data.

## Security packaging note

The final project ZIP intentionally excludes real `.env` files and `node_modules`. It includes `.env.example`. Copy your private environment values locally; do not distribute API keys, database credentials or SuperAdmin passwords in the demo package.
