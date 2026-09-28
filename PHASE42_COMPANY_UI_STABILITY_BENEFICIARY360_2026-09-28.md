# Phase 42 — Company UI Stability, Beneficiary 360 and Sync UX

## What changed
- Removed the redundant top-bar **All modules** action. The sidebar and global search remain the primary navigation surfaces.
- Moved breadcrumbs/context navigation above the workspace toolbar for consistent orientation on every Company screen.
- Replaced the desktop-looking sidebar `X` affordance with proper collapse behavior. Mobile uses a panel-collapse icon rather than an ambiguous close button.
- Added an always-discoverable **AI Operations** shortcut in the Company sidebar while preserving role-based access.
- Reworked **Beneficiary 360** into four progressive tabs: Overview, Survey & Evidence, Material & Assets, Service & Compliance.
- Rebuilt delivery lineage, evidence gallery, material custody tables, execution KPIs and service/compliance sections for readable enterprise presentation.
- Normalized button/search/select heights, bulk toolbars, table scrolling and responsive behavior across Company screens.
- Fixed the persistent online `N changes waiting to sync` banner: online idle state no longer stays visible, background retries continue every 15 seconds, invalid permanent queued writes are retired, and only a short warning is shown if a saved change cannot be replayed.

## AI status
- AI Operations frontend route and navigation are wired.
- `/api/platform/ai/status` and `/api/platform/ai/brief` are mounted.
- Finance AI advice route is mounted.
- The Gemini key remains backend-only and must be configured in Vercel as `GEMINI_API_KEY`.
- `gemini-3.8-flash` remains the default configured model with `gemini-2.5-flash` fallback.

## CRUD principle
Company operational CRUD remains capability/role based. Master/configuration data can use create/edit/archive/delete where safe. Evidence, survey, dispatch, receipt, installation, financial and audit-linked records use governed cancellation/archive/reconciliation instead of destructive hard-delete so chain-of-custody and compliance history are not lost.

## QA
Phase 42 adds source contracts for sync-banner lifecycle, AI navigation visibility, breadcrumb position, sidebar collapse affordance, Beneficiary 360 tabs and scalable table/bulk-toolbar styling.
