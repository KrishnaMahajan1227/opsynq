# Solarize Admin / Superadmin V7

## Dashboard
- Added a management-focused Execution Health strip for pending review, installation workload, delayed work, complaints and completed/closed work.
- Existing pipeline and survey-health visualizations remain, with restrained enterprise styling.
- User presence section now combines last-known/live location list and map.

## Farmer Records
- Search remains permanently visible.
- Advanced filters stay in the right-side filter drawer.
- The following high-frequency bulk actions are permanently visible and selection-aware:
  - Bulk Update Surveyor
  - Bulk Update Survey Status
  - Bulk Update Final Inspection Status
- Admin surveyor reassignment keeps the existing reason / approval flow.

## Installation / Completed / Complaints
- Each workspace now has a permanently visible search field and result count.
- Secondary filters open in a right-side drawer and support district, technician/surveyor and application status.
- Filters reset when moving to another workspace to avoid hidden stale filtering.

## User Management
- Added user governance summary (total users, admins, technicians, location available).
- Added search, role and account-status filters.
- Added account status, last-known location, accuracy, last seen and direct Open Map access.
- Existing add/edit/delete permissions and flows remain unchanged.

## Location presence
- A generic location tracker now mounts for every authenticated route, so Admin, Superadmin and Technician sessions can report last-known location after browser permission is granted.
- Location updates are persisted on the User record by the V7 backend.
- Socket.IO is JWT-authenticated; client-supplied identity is not trusted.
- Organization-wide location events are broadcast only to authenticated Admin/Superadmin monitoring sockets.
- Location depends on browser/device permission and HTTPS. If permission is denied, the UI shows location as unavailable rather than fabricating a position.

## QA performed
- All frontend JS/JSX files parsed successfully with the local TypeScript parser: 0 syntax errors.
- All CSS files passed structural brace checks.
- Backend JavaScript files passed `node -c` syntax checks.
- No new npm dependency was added.
- Full Vite build could not be executed because this environment cannot reach the npm registry and the supplied ZIP contains no node_modules.

## Deployment order
Deploy the V7 backend and V7 frontend together because real-time location sockets are now authenticated and last-location persistence requires the updated User schema/server handler.
