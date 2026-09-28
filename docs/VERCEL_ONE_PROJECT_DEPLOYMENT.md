# OPSYNQ — One Git Repository / One Vercel Project

This release uses a **single standard Express/Node deployment**. It intentionally does not use Vercel Services.

## Runtime map
- `/` and Platform SPA routes → Platform frontend
- `/agency` and `/agency/*` → Agency Operations frontend
- `/api/*` → existing Express API
- `/socket.io/*` → existing Socket.IO server

## Vercel settings
- Project Name: `opsynq`
- Framework Preset: **Express**
- Root Directory: **`./` (repository root)**
- Build Command: leave default
- Install Command: leave default
- Output Directory: leave default

The root `package.json` defines `build` and `start`. The build creates both Vite `dist` folders; root `server.js` starts the existing API server, which serves both frontends before the API 404 middleware.

## Environment
Import `VERCEL_ENV_IMPORT.env` in Vercel Environment Variables. Keep it out of Git; `.gitignore` already excludes it.

Frontend API/socket URLs can stay blank in production because the apps use same-origin URLs. The Vercel hostname is included in the backend CORS allowlist automatically.

## Password recovery email
The app can deploy while `EMAIL_PROVIDER`, `EMAIL_FROM`, and `RESEND_API_KEY` are blank. Recovery email delivery activates after Resend is configured.

## Persistent files
Vercel compute is stateless. Runtime-generated local files are not durable. Production media should use Cloudinary/external storage.

## Automation
The API retains its protected `/api/cron/automation` endpoint and local scheduler behavior. No Vercel cron is declared in this release; first deployment is intentionally kept minimal. A Vercel Cron can be added after the base deployment is healthy.
