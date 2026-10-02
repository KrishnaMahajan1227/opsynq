# Opsynq Client Demo Readiness — updated 02 Oct 2026

## Supported local runtime

- Node.js: **24.x**
- npm: use the version bundled with Node 24
- MongoDB: reachable through `services/api/.env`
- Platform UI: `http://localhost:5173/?login=1`
- Agency UI (normally reached through unified sign-in): `http://localhost:5174`
- API: `http://localhost:3000`

## One-time preparation / fresh seed

From the repository root:

```powershell
npm ci
# Restore the existing private .env files unchanged.
$env:OPSYNQ_DB_PURPOSE="demo"  # set only after personally confirming the target is demo/dev
npm run demo:db-check
# Add the 58 real JPG files listed in services/api/demo-media/FILE_TREE.txt
npm run demo:seed-ready
```

`demo:db-check` is read-only. Unexpected accounts, organizations, mappings or business data block the operation; nothing is automatically deleted. `demo:seed-ready` uploads the 58 real assets to Cloudinary, verifies their URLs, seeds exactly 18 beneficiaries, then runs the database sanity checks. Existing credentials are required and are never created/reset by this seed.

The seeded demo includes two companies, three agencies, Company users across multiple roles, Agency Superadmin/Admin/Technician users, 18 beneficiaries, work packages, inventory, serialized hardware, procurement/GRN, shipments, installed assets, service cases, claims, PDI/insurance/compliance, audit data and six media-rich beneficiary records (58 unique real-photo/document slots).

## Start the demo

Terminal 1:

```bash
npm run backend
```

Terminal 2:

```bash
npm run frontend
```

Terminal 3 — final verification:

```bash
npm run verify:local
npm run demo:verify
```

`demo:verify` is intentionally stricter than the old verifier. It checks:

- backend readiness
- all 13 seeded Company accounts and expected roles
- all 11 seeded Agency/Admin/Technician accounts and secure handoff
- Agency/Technician beneficiary scoping
- Company operations, inventory, logistics, quality, finance/read-only route access
- Viewer write rejection
- Reports catalog
- RMS overview
- one-time Agency handoff replay protection
- server-side AI configuration and a live Company-scoped AI brief

Do not start the client demo if `demo:verify` fails.

## Source / release checks used for this release

```bash
npm run qa:release
npm run uat:contracts
```

These cover syntax, module imports/exports, React effect cleanup, permissions, role navigation, route coverage, beneficiary/agency scoping, installation and material custody, inventory/procurement/logistics, evidence/audit, AI wiring, resilience, large-table UX, RMS-related navigation/contracts, scanner contracts, reports and release markers.

## Demo login examples

Use the account identifiers in `docs/DEMO_ACCOUNTS.md`. Passwords remain the pre-existing environment/account values and are intentionally not printed or embedded in source. The quick-select buttons in Agency login fill only the mobile number; the operator enters the existing password.

For `npm run demo:verify`, supply that existing password only as a temporary process/session variable named `DEMO_LOGIN_PASSWORD`; do not commit it or add it to documentation.

## Client data injection rule

Do not overwrite demo master data directly in MongoDB during a meeting. Use the product import/create flows:

1. create/verify Program → Contract/LOA → Work Order → Work Package
2. map/onboard Agency
3. import beneficiaries using the provided template and row-error report
4. import/create Item Master
5. create PO / GRN / serial inventory
6. dispatch/issue material
7. technician scans and installs serialized hardware
8. evidence/PDI/commissioning is recorded
9. RMS device is mapped to beneficiary/installed asset
10. reports/audit/RMS/service flows consume the same source records

For a real client file, first import a small sample (5–10 rows), verify mappings and validation errors, then import the full file.

## Known external/deployment dependencies

The source release cannot independently certify these without the target environment/provider:

- live MongoDB availability and client-network access
- Cloudinary credentials/storage behavior
- external email/SMS/WhatsApp provider delivery
- live Gemini API quota/network access
- vendor-specific live RMS REST/MQTT/Webhook connector
- browser/device camera/geolocation permissions
- client-specific source file quality and field mapping

The demo simulator and seeded records remain available for provider-independent demonstrations.
