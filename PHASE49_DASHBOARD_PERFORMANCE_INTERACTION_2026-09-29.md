# Phase 49 — Dashboard analytics, interaction affordance and performance

## Dashboard UX
- Company Dashboard keeps role-specific information architecture and adds restrained semantic KPI tones.
- Execution-oriented roles get two compact visual summaries: execution mix and survey health, plus state execution drill-down.
- State execution remains filterable and links to Beneficiary Records / Geo Operations.
- Dashboard shows last refresh state and background supporting-metric refresh without blocking the primary view.
- Agency Admin/Superadmin retain their existing chart dashboards; route-level code splitting reduces the initial Agency bundle loaded for each role.

## Interaction affordance
- Clickable rows, folder cards, linked records, dashboard actions and nav controls use consistent hover/focus treatment.
- Keyboard focus uses a visible accessible outline.
- Disabled controls do not receive interactive hover treatment.

## Performance
- Company dashboard beneficiary/survey/state/district rollups now run in MongoDB aggregation facets instead of loading every beneficiary record into Node memory.
- Company dashboard renders the primary operations summary first and refreshes service/inventory/logistics/finance metrics in the background.
- A two-minute session dashboard snapshot gives immediate repeat-navigation rendering while data revalidates.
- GET calls have a short in-memory cache; any successful write clears it.
- Company feature domains and Agency route pages are lazy-loaded so users do not download every module up front.
- Loading states use lightweight branded skeleton/spinner UI rather than blank screens.

## Scale note
These changes reduce application-memory growth and repeated network/module loading. They do not make remote database/Vercel cold-start latency literally zero; production latency still depends on deployment region, database region/indexes, and network conditions.
