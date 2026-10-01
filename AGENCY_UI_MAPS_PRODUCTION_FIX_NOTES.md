# Agency UI / Maps Production Fix — 2026-10-01

## Fixed from reported production console errors
- Removed Bootstrap and Bootstrap Icons CDN tags from Agency `index.html`; both are bundled from npm.
- Disabled CSS code splitting for Agency production build so lazy routes/modals cannot request stale per-component CSS chunks.
- Added same-origin normalization for legacy `http://localhost:3000/demo-media/...` URLs.
- Future demo seed media paths are relative by default.
- Replaced mandatory production Socket.IO dependency with authenticated REST location heartbeat plus 30-second polling. Socket.IO remains opt-in for persistent Node hosts using `VITE_ENABLE_SOCKET_REALTIME=true`.
- Added `POST /api/users/me/location` with authenticated self-only persistence and coordinate validation.
- Strengthened Leaflet map sizing/invalidation, empty/loading states and last-known user locations.

## UI/UX
- Final Agency visual layer aligns Admin, Superadmin and Technician workspaces to the Company neutral/forest system.
- Normalized navigation, headers, cards, command bars, forms, tables, badges, modals, dashboard charts, map/presence panels, beneficiary details, technician queues, upload, login and registration surfaces.
- Responsive behavior included for tablet and mobile layouts.

## Validation run
- frontend JSX syntax
- React effect cleanup
- permission contracts
- strict role navigation
- API route contracts
- Phase 28 resilience
- Phase 40 professional UX
- Phase 42 UI stability
- Phase 49 dashboard/performance
- Agency final workflow contracts (13 checks)
- exact regression guards for CDN, CSS bundling, media URL normalization, REST location and map polling

## Deployment
Run a clean install/build so old hashed assets are not reused:

```bash
npm ci
npm run build:agency
npm run qa:agency-final
```

For Vercel keep `VITE_ENABLE_SOCKET_REALTIME=false` (or unset). Leave `VITE_API_URL` empty in production when frontend and API share the same HTTPS origin.
