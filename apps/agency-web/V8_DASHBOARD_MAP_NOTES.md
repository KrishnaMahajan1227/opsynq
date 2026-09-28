# V8 Dashboard + Location Map refinement

## Dashboard
- Removed the duplicate KPI tile strip from both Admin and Superadmin Overview.
- Execution Health is now the single operational summary for pending/review, installation workload, delayed cases, complaints and completed/closed work.
- Existing pipeline, survey-health chart, attention queues, quick access and location monitoring remain intact.

## Location map reliability
- Replaced the embedded Google Maps JavaScript integration with OpenStreetMap + Leaflet using dependencies already present in the project.
- No `VITE_GOOGLE_API_KEY`, Google billing configuration or Maps JS script is required for the embedded dashboard map.
- Validates latitude/longitude before rendering.
- Automatically fits all tracked users; a single tracked user gets a closer operational zoom.
- User popup shows name, role, mobile, last-seen time and reported accuracy when available.
- Direct "Open location" link opens the coordinate in Google Maps in a new tab; this does not affect embedded map rendering.
- Professional loading and no-location-data states are included.

## Location prerequisites
- Browser/device location permission must be granted by the logged-in user.
- Production should run over HTTPS for browser geolocation.
- Backend V7/V8 authenticated Socket.IO + persisted last-known location implementation is retained.
