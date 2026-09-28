# Phase 6 local smoke test

Use the same `.env` files you already have. Phase 6 does not require you to rewrite them.

## Start
From the repository root:

```powershell
npm run backend
```

In a second terminal:

```powershell
npm run frontend
```

This starts:
- API: http://localhost:3000
- Platform: http://localhost:5173
- Agency: http://localhost:5174

Optional reachability check:

```powershell
npm run verify:local
```

## Phase 6 smoke flow
1. Sign in to Platform Web.
2. Open a company workspace.
3. Configure an SLA rule for `SERVICE_CASE` (for example 48 hours, 6-hour warning).
4. Open Service / Warranty and create a case linked to an installed asset.
5. Confirm due/SLA state appears.
6. Change case to IN_PROGRESS and then RESOLVED.
7. Open the installed asset lifecycle and confirm service open/close history is retained.
8. Open Warranty & AMC and create a plan for an installed serial.
9. Open Claims & Receivables, create a claim and move it through READY / SUBMITTED / APPROVED / PAID.
10. Confirm Company Overview reflects service attention and commercial values.

## If dependencies were already repaired in Phase 5.1
No additional package is introduced by Phase 6. You do not need another dependency install solely for Phase 6.
