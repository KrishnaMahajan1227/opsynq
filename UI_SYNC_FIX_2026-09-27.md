# UI + Offline Sync Fix — 2026-09-27

## Offline queue / persistent sync banner
- `apps/platform-web/src/core/resilience.jsx` now checks and flushes queued writes when the app mounts while already online.
- A write queued after a transient network error schedules an immediate retry instead of waiting for a future browser `online` event.
- Returning focus to the app / restoring a visible tab also retries pending writes.
- Concurrent sync runs are guarded to prevent duplicate submissions.
- The banner still reflects real unsynced writes; it disappears only when the IndexedDB queue actually reaches zero.

## Professional control-density pass
- Platform web: normalized shared buttons, search bars, filters, form fields, toolbars, icon buttons and notification-row spacing around a 38px standard control height.
- Agency web: normalized Bootstrap-derived controls to the same compact operational scale and removed decorative button gradients/shadows from primary actions.
- Semantic colors (danger/warning/success/status indicators) remain available for meaningful differentiation; ordinary actions use restrained green/neutral treatment.

## Scope guardrails
- No backend schema, RLS, audit, business workflow, role permission, routing or API contract changes.
- Page-specific dashboards/data visualizations were not redesigned; this pass targets consistency, density and the reported sync-state defect.
