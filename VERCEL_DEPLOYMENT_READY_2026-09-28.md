# OPSYNQ — Final Single-Vercel Release

## Why this release exists
The earlier Vercel Services beta configuration repeatedly failed to resolve declared services in the project. This release removes that dependency entirely and deploys OPSYNQ as one standard Node/Express application.

## What changed
- Added root `server.js`, which loads the existing `services/api/server.js` backend.
- Added root `build` and `start` scripts.
- Root build produces both Platform and Agency Vite builds.
- Existing API server now serves Platform and Agency production build outputs before its API 404 middleware.
- `/` is Platform; `/agency` is Agency; `/api` remains backend.
- Agency production Vite base remains `/agency/`.
- Production frontend API/socket configuration remains same-origin when URL env vars are blank.
- Vercel Services `vercel.json` was removed.
- Node engine declarations are aligned to Node 24.x, matching the current Vercel build runtime observed during deployment.
- Existing security, recovery, role, permission, offline-sync, procurement, inventory, geo, evidence and reporting changes are preserved.

## Vercel project settings
Use exactly:
- Framework Preset: **Express**
- Root Directory: **`./`**
- Build Command: default
- Install Command: default
- Output Directory: default

Do not select `apps/agency-web`, `apps/platform-web`, or `services/api` as the project root.

## QA
Source regression suite and API route contracts pass after this patch. The execution environment timed out while downloading a fresh npm dependency tree, so a full clean production bundle was not used as the final local gate. Vercel had already demonstrated that the Agency Vite build itself completes successfully on the same repository dependencies; this release changes deployment composition rather than application feature code.
