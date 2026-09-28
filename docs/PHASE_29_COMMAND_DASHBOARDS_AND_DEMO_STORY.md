# Phase 29 — Command Dashboards, Notification Preview and Demo Storytelling

Phase 29 keeps the Opsynq visual language intentionally restrained while making the product substantially easier to demonstrate and operate.

## Design direction

- English-only user-facing UI.
- Neutral white/off-white work surfaces with the existing dark Opsynq navigation.
- One restrained green accent for primary progress/active states.
- Amber/red only for warnings, exceptions and overdue work.
- No decorative gradients, multi-color card backgrounds or overloaded chart grids.
- Dashboard density is limited to a small KPI row, two analytical blocks per row and concise action/activity sections.

## Company command dashboard

The Executive Overview now provides role-aware command information instead of a generic decorative dashboard.

- KPI cards are actionable and route to the relevant workspace.
- Dashboard filters are handed to Beneficiary Records through session-scoped drill-down state.
- Beneficiary stage distribution is generated from live Farmer/Application status data.
- Survey status distribution is generated from live inspection state.
- District execution is aggregated from company beneficiary context and shows completion ratios.
- Service, assurance and commercial signals are shown only when the signed-in role has the related capability.
- Viewer-level users do not receive operational actions they cannot access.

## Notification bell

The workspace bell supports both hover preview and click-to-pin behavior.

- Hover shows a compact six-item preview.
- Click pins the preview while the user interacts with it.
- Unread count remains visible on the bell.
- Selecting a notification marks that user's notification state as read and routes to the related module when an action URL is present.
- The full Notification Center now supports search, type/read filters and a detailed notification record view.

## Demo data

The demo seed now contains 24 beneficiary scenarios distributed across Nagpur, Nashik and Pune with operationally meaningful variation:

- pending survey
- survey in progress
- survey completed
- pending installation
- move to installation
- ordered
- dispatch completed
- ready for installation
- installation completed
- complaint raised
- closed/completed
- missing-document and field-verification examples
- service-assigned examples

The bundled media library contains 18 distinct field images/variants and the seed assigns different survey/installation evidence combinations across demo records.

## Drill-down behavior

Dashboard navigation persists the intended filter for the target module. Beneficiary Records consumes status, survey and district filters from the dashboard and supports the same filters in its right-side filter drawer.

## Run

```powershell
npm run seed:full-demo
npm run backend
npm run frontend
npm run qa:release
```

Existing `.env` files remain user-managed and are not created, overwritten or packaged by Phase 29.
