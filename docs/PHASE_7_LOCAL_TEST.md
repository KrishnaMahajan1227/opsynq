# Phase 7 local verification

Keep your existing `.env` files exactly as they are.

## First / repeatable bootstrap
From repository root:

```powershell
npm run seed
```

This command is safe to run again. It updates the Platform Superadmin from the existing `.env` instead of creating duplicate platform accounts.

## Run
Terminal 1:
```powershell
npm run backend
```

Terminal 2:
```powershell
npm run frontend
```

Optional checks:
```powershell
npm run db:test
npm run verify:local
```

## Phase 7 smoke test
1. Login as Platform Superadmin.
2. Open an active Company → Open operations.
3. Open Analytics & Reports and verify execution / claim / inventory / shipment summaries load.
4. Open Notifications → create a company notification → mark it read.
5. Open Documents → upload a PDF/image/Excel → verify it opens from the repository.
6. Open Audit Trail → verify the document upload and notification create actions are present.
7. Open Agency Web and confirm existing Agency login / Farmer / Technician flows still load.
