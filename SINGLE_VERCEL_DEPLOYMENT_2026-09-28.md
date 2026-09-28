# OPSYNQ — Single Vercel Deployment

This release intentionally does **not** use the Vercel Services beta.

## Public routes
- `/` and Platform SPA routes → `apps/platform-web/dist`
- `/agency` and `/agency/*` → `apps/agency-web/dist`
- `/api/*` → existing Express API
- `/socket.io/*` → existing Socket.IO server

## Vercel project settings
- Framework Preset: **Express**
- Root Directory: **repository root (`./`)**
- Build Command: leave default (root `npm run build` is defined)
- Install Command: leave default
- Output Directory: leave default
- Node: package manifests target **24.x**

## Build lifecycle
Root `npm run build` builds both Vite apps. Root `server.js` loads the existing
`services/api/server.js`, which serves the two generated `dist` directories
before its API 404 middleware.

## Environment
Use `VERCEL_ENV_IMPORT.env` in Vercel Environment Variables. Do not commit real
`.env` files. Blank provider values (Resend/decision service etc.) remain optional until
those integrations are enabled.

## Important Vercel limitation
The runtime is stateless. Do not rely on `services/api/uploads` for durable
production storage; persistent uploads should use Cloudinary/external storage.
