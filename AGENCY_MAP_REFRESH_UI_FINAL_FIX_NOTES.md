# Agency / Maps / Refresh final production fix — 2026-10-01

## Fixed
- Removed automatic full-page reloads on tenant data revision changes in Agency and Company applications.
- Removed automatic full-page reload after offline queue sync. Successful sync now emits a silent `opsynq:data-refresh` event.
- Deployment/runtime revision changes show an explicit `Update now` banner instead of interrupting active work.
- Agency Admin, Superadmin and Technician dashboards silently refetch visible data on `opsynq:data-refresh` without changing route/tab/form/modal state.
- Company Geo Operations silently refetches map data on the same event.
- Removed direct OpenStreetMap volunteer tile endpoint that was returning `403 Access blocked` in production.
- Company Geo Operations and Agency user-location map use Esri World Street Map with CARTO Voyager automatic fallback after tile failures.
- Added final Agency visual refinement for typography, neutral forest palette, cards, inputs, tables, buttons, navigation, responsive layout and map controls.

## Regression checks
- `node scripts/jsx-syntax.js`
- `node scripts/effect-contracts.js`
- `node scripts/agency-map-refresh-regression.js`
- `node scripts/agency-final-contracts.js`
- `node scripts/phase28-contracts.js`
- `node scripts/phase40-professional-ux-contracts.js`
- `node scripts/phase42-ui-stability-contracts.js`
- `node scripts/permission-contracts.js`
- `node scripts/role-navigation-contracts.js`
- `node scripts/route-contracts.js`
- `node scripts/phase49-dashboard-performance-contracts.js`
- `node scripts/phase53-geo-receipt-scanner-contracts.js`
- `node scripts/data-integrity-contracts.js`

## Build note
The provided source archive does not contain installed `node_modules`, so Vite cannot be executed in this sandbox. Run `npm ci && npm run build:all` in the deployment environment before publishing.
