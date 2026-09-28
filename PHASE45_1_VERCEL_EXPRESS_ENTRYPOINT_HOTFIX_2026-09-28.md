# Phase 45.1 — Vercel Express entrypoint hotfix

## Build failure fixed
Vercel successfully built both Vite frontends, then failed with:

`Error: No entrypoint found which imports express. Found possible entrypoint: server.js`

The root `server.js` only re-exported `services/api/server.js`. Although the real API file imports Express, Vercel's project-root Express detector did not follow that indirection during framework detection.

## Fix
- Root `server.js` now imports `express` directly and then re-exports the existing API server.
- Root `package.json` explicitly declares Express so the deployment entrypoint and dependency graph agree.
- No API routes, auth, Socket.IO, AI Operations, frontend routing, or business logic were duplicated or changed.
- Version bumped to `0.45.1`.

## Expected Vercel sequence
1. Install dependencies.
2. Build Platform frontend.
3. Build Agency frontend.
4. Detect root `server.js` as Express entrypoint.
5. Deploy the existing single-project server.

The large Vite chunk messages are warnings, not deployment failures.
