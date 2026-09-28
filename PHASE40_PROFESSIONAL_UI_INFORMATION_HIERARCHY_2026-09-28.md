# Phase 40 — Professional UI & Information Hierarchy

This pass keeps Phase 39 supply-chain capabilities intact while reducing visual density and duplicated context.

## UX changes
- Restored compact professional page headers across the Company workspace: eyebrow, title, short purpose statement and right-aligned actions.
- Added contextual back navigation for hidden Delivery Portfolio and Supply Operations drill-down screens.
- Kept compact workspace breadcrumbs as secondary navigation rather than relying on browser Back.
- Renamed sidebar groups to `Program Delivery` and `Supply Operations` while preserving route/module IDs and permissions.
- Simplified Supply Chain Control into a clear operating sequence: Procure → Receive → Store → Dispatch → Agency Receipt → Issue & Install.
- Reduced overview density to four compact metrics, four work-area folders, one exception queue, one dispatch-capacity panel and one bounded recent-dispatch table.
- Detailed agency, fleet, shipment, stock and custody information remains in the dedicated drill-down screens instead of being duplicated on the control page.
- Responsive rules keep headers, breadcrumbs, metrics and workflow usable on tablet/mobile.

## Regression protection
- Phase 24–40 source contracts pass.
- Frontend JSX syntax parser passes.
- Backend syntax, permissions, role navigation and API route coverage pass.
- Existing Phase 39 fleet/dispatch/procurement/custody functionality remains intact.
