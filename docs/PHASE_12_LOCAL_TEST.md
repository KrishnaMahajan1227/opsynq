# Phase 12 Local Test

Keep your existing `.env` files unchanged.

## 1. Source QA
From repository root:

```powershell
npm run qa:source
```

Expected:
- backend syntax passes
- all company screen registry entries resolve
- no real `.env` packaged
- local named import/export contracts pass

## 2. Start Opsynq
Terminal 1:

```powershell
npm run backend
```

Terminal 2:

```powershell
npm run frontend
```

## 3. Platform Superadmin smoke test
1. Sign in as Platform Superadmin.
2. Open Overview.
3. Confirm Global Control Tower renders without `PageHeader` import errors.
4. Confirm portfolio cards / sections load.
5. Open Companies.
6. Open a company.
7. Edit company profile and save.
8. Add a company user.
9. Edit the user's role/contact.
10. Deactivate and reactivate the user.
11. Open company operations and confirm previous Company modules remain accessible.

## 4. Existing flows regression
Run:

```powershell
npm run verify:local
```

Then smoke-test existing Agency login, Farmer Records, Technician and Installation flows.
