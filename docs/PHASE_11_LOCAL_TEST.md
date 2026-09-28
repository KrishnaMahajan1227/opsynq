# Phase 11 local verification

Use the existing configured environment files. Do not recreate them.

## Start

Terminal 1:

```powershell
npm run backend
```

Terminal 2:

```powershell
npm run frontend
```

## Source sanity

```powershell
npm run qa:source
```

## Runtime verification

```powershell
npm run db:test
npm run verify:local
```

## Screen smoke test

1. Platform Superadmin login.
2. Open Companies and enter a Company Operations workspace.
3. Open every sidebar group and confirm every module renders.
4. Programs: create, search, edit, close.
5. Contracts / LOA: create, edit, close.
6. Work Orders: create, edit, close.
7. Agencies: create, edit, suspend/activate, archive only after active packages are resolved.
8. Work Packages: create, assign/reassign with reason, change status, close.
9. Beneficiary Imports: download template, import a valid batch, import an invalid row and download the error CSV.
10. Continue through Inventory, Logistics, Assets & Service, Commercial, Governance and System screens.
11. Open the Agency application and verify existing Farmer → Survey → Technician → Installation → Final Inspection → Complaint flow.

A 401/session expiry should return the user to the public/sign-in state rather than leaving a broken workspace.
