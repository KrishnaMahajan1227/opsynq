# Opsynq Phase 13 — Navigation & Universal Search

## Objective
Make every Platform/Company module consistently visible and easy to reach while adding a company-scoped universal record search.

## Navigation changes
- Domain groups are sourced from `apps/platform-web/src/layout/moduleRegistry.jsx`.
- All groups are expanded by default on first use.
- Group collapse state and compact-sidebar state persist locally per browser.
- Current module automatically re-opens its group.
- Sidebar module list owns its own vertical scroll; account/logout remain reachable.
- Module search filters labels and keywords without hiding unmatched groups permanently.
- `Ctrl/Cmd + K` opens a searchable module switcher.
- Workspace `All modules` button opens the same switcher.
- Compact navigation keeps every module reachable through icon buttons/tooltips.

## Universal record search
Company workspaces now expose one search box that searches permitted company data across:
- Work Orders
- Work Packages
- Agencies
- Beneficiaries/Farmers linked through `BeneficiaryContext`
- Shipments
- Inventory serial/barcodes
- Claims
- Service cases

The endpoint is tenant-scoped. Company users search only their company. Platform Superadmin search requires the currently opened company context.

## QA hardening
`npm run qa:source` now validates the new module registry against screen mappings and confirms the universal-search route is mounted.

## Environment
No `.env` file is included or changed in this phase.
