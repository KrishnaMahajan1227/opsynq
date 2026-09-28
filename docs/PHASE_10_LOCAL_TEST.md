# Phase 10 local test

Keep your existing `.env` files exactly as already configured.

From the repository root:

```powershell
npm run seed
npm run backend
```

In a second terminal:

```powershell
npm run frontend
```

Optional verification:

```powershell
npm run db:test
npm run verify:local
```

Platform Web checks:
1. Sign in as Platform Superadmin.
2. Open Companies and enter a Company Operations workspace.
3. Verify the sidebar is grouped by domain.
4. Search for modules using `Find module…` (for example `claim`, `warehouse`, `audit`).
5. Open at least one screen from every group and verify the page loads.
6. Collapse the sidebar and verify icon navigation remains usable.
7. Verify Company → Program → Contract → Work Order → Work Package flows remain available.
8. Verify Inventory, Logistics, Service, Governance and Automation pages remain available.
9. Open Agency Web and verify existing Farmer/Technician/Installation flow is unchanged.
