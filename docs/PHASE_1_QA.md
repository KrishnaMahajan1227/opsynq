# Phase 1 QA Notes

Validated in the build workspace:
- New backend JS files and existing API JS files pass Node syntax checking.
- No supplied MongoDB username/password, Google API key or generated JWT secret is present in repository source files.
- Platform API route mounts are present under `/api/platform/auth` and `/api/platform/companies`.
- Existing Agency application source remains present under `apps/agency-web`.
- `.env` files are ignored while `.env.example` remains versionable.

Build limitation in this environment:
- `npm install --prefer-offline` could not complete within the environment timeout, therefore the Vite production build could not be executed here.
- Run `npm install`, `npm run build:platform`, and `npm run build:agency` in a normal network-enabled development environment before deployment.
