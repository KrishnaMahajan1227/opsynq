# Phase 17 local verification

Use your existing configured environment files unchanged.

## Start

Terminal 1:

```powershell
npm run backend
```

Terminal 2:

```powershell
npm run frontend
```

## Release checks

```powershell
npm run qa:release
npm run smoke:local
```

## Role checks

1. Sign in as Company Owner or Company Admin.
2. Open **System → Team & Access**.
3. Create a Viewer or functional manager account.
4. Sign in with that account and confirm company data remains readable.
5. Open a module outside that role's management scope and verify the **View-only access** banner.
6. Confirm restricted mutations return a clear permission message rather than a broken screen.
7. Confirm Company Owner rows show **Platform controlled** for company-level managers.

## Saved view checks

1. Open Work Packages, enter a search, select **Save view**, name it, clear search, then re-apply it.
2. Repeat for Service / Warranty cases with a status filter.
3. Repeat for Claims & Receivables.
4. Confirm saved views remain scoped to the current company/browser.

## Regression

Navigate repeatedly between My Workspace, Work Packages, Inventory, Shipments, Service, Claims, Team & Access, Audit and Automation. No `destroy is not a function`, missing-export, or unhandled permission error should appear.
