# Phase 14 local verification

1. Keep your existing `.env` files unchanged.
2. From repository root run `npm install --include=optional --legacy-peer-deps` only when dependencies are not already installed.
3. Run `npm run qa:release`.
4. Terminal A: `npm run backend`.
5. Terminal B: `npm run frontend`.
6. Terminal C: `npm run smoke:local`.
7. Verify `http://localhost:3000/api/health/live` and `http://localhost:3000/api/health/ready` both return HTTP 200.
8. Sign in to Platform and Agency; verify the System ready indicator remains green while API is healthy.
9. Stop the API and confirm Platform shows API offline; restart it and confirm recovery without refresh.
