# OPSYNQ — One Git Repository / One Vercel Project

This release is configured for Vercel Services:

- `/` -> Platform/Company frontend (`apps/platform-web`)
- `/agency/*` -> Agency Operations frontend (`apps/agency-web`)
- `/api/*` -> Express API (`services/api`)
- `/socket.io/*` -> API service for Socket.IO/WebSocket traffic

The frontend automatically uses same-origin API/Socket URLs in production, so generated Vercel deployment domains do not need to be known before the first deploy. Vercel-provided deployment URLs are also included in the API CORS allowlist automatically.

## Environment

Import `VERCEL_ENV_IMPORT.env` in the Vercel project. It intentionally leaves email-provider values blank if they were not present in the supplied environment files. Configure Resend later to activate production Forgot Password email delivery.

Never commit `VERCEL_ENV_IMPORT.env` to Git. It is excluded by `.gitignore` in this release.

## Hobby automation

The local API retains its 15-minute in-process automation scheduler. On Vercel it is disabled because compute can scale to zero. A once-daily Hobby-compatible Vercel Cron calls `/api/cron/automation`; `CRON_SECRET` must be configured. On a paid plan, the schedule can be increased.

## Persistent files

Vercel compute is stateless. Runtime-generated local files must not be treated as durable storage. Existing Cloudinary-backed media remains the production-safe path for persistent uploads.
