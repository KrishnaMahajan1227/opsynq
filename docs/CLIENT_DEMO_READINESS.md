# Opsynq Client Demo Readiness — 30 Sep 2026

## Supported local runtime

- Node.js: **24.x**
- npm: use the version bundled with Node 24
- MongoDB: reachable through `services/api/.env`
- Platform UI: `http://localhost:5173/?login=1`
- Agency UI (normally reached through unified sign-in): `http://localhost:5174`
- API: `http://localhost:3000`

## One-time preparation

From the repository root:

```bash
npm run env:fix-ai
npm run clean:install
npm ci
npm run demo:preflight
npm run db:test
```

`env:fix-ai` moves server-only Gemini configuration out of the Platform frontend env and into `services/api/.env` without printing the secret.

## Reset / seed the demo data

```bash
npm run seed:full-demo
```

Default demo password unless `DEMO_DEFAULT_PASSWORD` is overridden:

```text
Demo@1234
```

The seeded demo includes two companies, three agencies, Company users across multiple roles, Agency Superadmin/Admin/Technician users, beneficiaries, work packages, inventory, serialized hardware, procurement/GRN, shipments, installed assets, service cases, claims, PDI/insurance/compliance, RMS data and 18 field-evidence images.

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

Company Admin:

```text
9000000002
Demo@1234
```

Nagpur Agency Superadmin:

```text
9200000001
Demo@1234
```

Nagpur Technician:

```text
9200000003
Demo@1234
```

Use the same Platform sign-in page for all three. Agency users are transferred through the one-time secure handoff.

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
