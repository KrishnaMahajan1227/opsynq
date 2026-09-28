# Solarize Admin / Superadmin V5 UX pass

## What changed
- Removed the competing top navbar from Admin/Superadmin dashboard routes.
- Fixed the app-level Bootstrap container conflict that could clip the fixed sidebar and workspace.
- Rebuilt Admin/Superadmin into one deterministic viewport shell: 286px sidebar, 78px compact rail, exact remaining content width.
- Added Upload Excel and account/logout actions to the sidebar so dashboard navigation is self-contained.
- Kept sidebar available on tablet/mobile as an icon rail instead of hiding it.
- Converted Farmer Records filters into a right-side filter drawer; technician month filter uses the same pattern.
- Added click-through Farmer Record detail workspace with grouped beneficiary, location, survey, installation and commercial/service information.
- Kept row controls interactive without accidentally opening the detail page.
- Hardened contrast for semantic badges, buttons, placeholder text and data-grid text.
- Kept wide datasets inside their own table scroller, preventing page-level horizontal overflow.

## Functional scope intentionally preserved
Existing API contracts, role permissions, farmer CRUD, status changes, assignments, installation/order flows, complaints/rework, payments, admin requests and user management remain unchanged.

## Build validation note
No new npm dependency was added. `npm ci` could not complete in the execution environment before timeout, so a full Vite production build could not be executed here. The changed source was manually checked for route/shell/state wiring and the archive was integrity-tested.
