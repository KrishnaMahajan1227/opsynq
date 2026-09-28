# Phase 27 — Executive UX, Record Intelligence & Notifications

- Larger, clearer sidebar typography with tighter accordion spacing.
- Role-aware company command dashboard with restrained visual charts.
- Notification bell in the global toolbar; notifications remain server-scoped to the signed-in user/role and preserve per-user read state.
- Master Data fetch hardening, retry UX, explicit active/type/domain filters and safer company context validation.
- Generic operational record drawers now render the complete server-returned record, nested relationships, metadata and timestamps instead of repeating only visible table columns.
- Generic resource lists gain status filters through the standard right-side filter drawer.
- Existing `.env` files remain external and are never rewritten by this release.
