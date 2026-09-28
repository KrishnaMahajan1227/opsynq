# Opsynq Phase 14 — Production Operations & Reliability

Phase 14 hardens the complete Phase 13 baseline for repeatable release and runtime operation.

## Delivered
- Liveness, readiness and version endpoints (`/api/health/live`, `/api/health/ready`, `/api/health/version`).
- Correct cross-platform uploads path for Linux/Windows production parity.
- Safer production error responses with request IDs.
- Response-time header and cleaner runtime request logging.
- Frontend backend-readiness indicator with 30-second polling.
- Agency unknown-route recovery instead of blank screens.
- `qa:routes` frontend-to-backend route-prefix contract test.
- `qa:release` composite release gate.
- `smoke:local` verifies API live/ready plus both frontends.
- `production:start` runs the API without watch mode.

## Release commands
```powershell
npm run qa:release
npm run build:all
```

## Local smoke
```powershell
npm run backend
npm run frontend
npm run smoke:local
```

Existing `.env` files are intentionally not packaged or rewritten.
