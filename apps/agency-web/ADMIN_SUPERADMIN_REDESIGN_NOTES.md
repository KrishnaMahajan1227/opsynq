# Admin & Superadmin Professional UX Redesign

## Scope
This pass redesigns the existing Admin and Superadmin dashboards as a consistent enterprise operations console without changing existing API contracts or business workflows.

## UX changes
- New sticky workspace header with role, screen title, purpose and refresh action.
- Neutral enterprise visual system (white / slate / charcoal / restrained green).
- Semantic color is reserved for success, warning and exception states.
- Sidebar navigation simplified and normalized across Admin and Superadmin.
- Removed rainbow KPI treatment; KPI cards are now neutral, compact and scan-friendly.
- Dashboard card nesting visually flattened to reduce noise.
- Charts use a restrained operational palette.
- Filters use a consistent compact control layout.
- Tables behave as scalable data grids with sticky headers and dense readable rows.
- Farmer Records supports 25 / 50 / 100 rows per page.
- Superadmin no longer renders every page number at once for large datasets.
- Pagination footer clearly shows visible vs filtered record counts.
- Buttons, badges, accordions and modals use one consistent interaction system.
- Responsive behavior improved for tablets and narrower admin screens.

## Functional compatibility
Existing APIs, auth headers, roles, assignments, edit flows, CSV export, complaint/rework flow, technician summary, payment workflows, installation workflows, user management and admin-request workflows remain in place.

## Files changed
- `src/pages/DashboardAdmin.jsx`
- `src/pages/DashboardSuperAdmin.jsx`
- `src/pages/AdminEnterprise.css` (new shared enterprise UX layer)

## Deployment QA checklist
1. Run `npm ci`.
2. Run `npm run build` and `npm run lint`.
3. Test Admin tabs at desktop/tablet widths.
4. Test Superadmin tabs at desktop/tablet widths.
5. Verify 25/50/100 Farmer Records page-size selection.
6. Verify search/filter/pagination interactions reset correctly.
7. Verify edit, assign technician, delete, payment and complaint modals.
8. Verify Superadmin user management and Admin Requests.
9. Verify location map/monitor panels with production map configuration.
10. Verify role/auth redirects against the production backend.

## Environment note
This workspace copy does not include `node_modules`, so a local production build was not executed here. The changes intentionally avoid package additions and use only existing React/React-Bootstrap/react-icons dependencies.
