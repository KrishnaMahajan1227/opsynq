# OPSYNQ — Vercel One-Project Release

This release is prepared for a single Git repository and a single Vercel Project using Vercel Services.

## Public routing
- `/` → Platform / Company frontend
- `/agency/*` → Agency Operations frontend
- `/api/*` → Express API
- `/socket.io/*` → Express API / Socket.IO

## Important deployment changes
- Added root `vercel.json` with three explicit services.
- Agency production assets use `/agency/` and production routing uses hash routing for reliable SPA refreshes under the subpath.
- Platform-to-Agency unified-auth handoff points to the same Vercel domain in production.
- Frontends use same-origin API/Socket connections in production when `VITE_API_URL` and `VITE_SOCKET_SERVER_URL` are blank.
- API automatically trusts the current Vercel production/preview hostname in CORS in addition to configured origins.
- Express/Socket.IO Node server is Vercel-compatible and targets Node 22.
- Local 15-minute automation scheduler remains for local/server deployments. On Vercel it is replaced by a once-daily Hobby-compatible Vercel Cron endpoint.
- Mounted the existing Agency inventory receipt route at `/api/agency-inventory`.
- Removed the Windows-only Rollup binary as a hard root dependency and repaired lock metadata for Linux/Vercel installs.
- Package registry references are normalized to `registry.npmjs.org`.

## Environment import
Use `VERCEL_ENV_IMPORT.env` in the Vercel Environment Variables import UI.

The file contains values recovered from the supplied project environment files. Production frontend URL variables are intentionally blank so same-origin routing is used. Email/Resend/Gemini fields that did not have supplied values remain blank.

**Do not commit `VERCEL_ENV_IMPORT.env`.** It is excluded by `.gitignore`.

## Email recovery
The application can deploy without Resend configured. Forgot-password email delivery becomes active after configuring:
- `EMAIL_PROVIDER=resend`
- `EMAIL_FROM=...`
- `RESEND_API_KEY=...`

`PUBLIC_APP_URL` can remain blank on Vercel; the current Vercel production URL is derived automatically.

## QA completed
- Backend syntax/source sanity
- Frontend JSX syntax
- Module import/export contracts
- Effect cleanup contracts
- Permission + role-navigation contracts
- Phase 24, 26–34 contracts
- API route contract coverage
- npm clean-install dry run on Linux dependency resolution

A full dependency download/build was not used as the final gate because the execution environment's package download repeatedly timed out. The Linux `npm ci --dry-run` completes successfully and the previous Windows-only platform blocker is removed.
