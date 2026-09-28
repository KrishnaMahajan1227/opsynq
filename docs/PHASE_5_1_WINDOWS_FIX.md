# Opsynq Phase 5.1 — Windows Runtime & Atlas Connectivity Fix

This is a stability patch on top of Phase 5. It preserves all Phase 5 business functionality and **does not package, read, replace, or modify any `.env` file**.

## What was fixed

- Vite `6.4.3`, Rollup `4.50.1`, React plugin `4.7.0`, and YAML `2.8.1` are explicitly pinned for deterministic Windows dependency resolution.
- `@rollup/rollup-win32-x64-msvc` is an explicit root dev dependency, avoiding npm's optional-dependency omission bug.
- Root dev scripts no longer depend on `npm --workspace ...` parsing:
  - `npm run dev:api`
  - `npm run dev:platform`
  - `npm run dev:agency`
  - `npm run seed:platform`
- API development uses Node 22 built-in `--watch`; `nodemon` is not required.
- API always loads the existing `services/api/.env` from its own directory.
- If the Mongo URI does not contain a database path, Opsynq uses database `OPSYNQ` by default. Optional `MONGO_DB_NAME` can override this later without changing code.
- Added `npm run db:test` to test Atlas independently of MongoDB Compass.
- Added `scripts/repair-install.ps1` for Windows dependency repair.
- Improved `npm run doctor` to verify Vite and the Windows Rollup native binary.

## Recommended repair — PowerShell

From the repository root (`D:\\Opsynq`):

```powershell
powershell -ExecutionPolicy Bypass -File .\\scripts\\repair-install.ps1
```

The script removes only `node_modules` and `package-lock.json`; it does not touch `.env` files.

Equivalent manual commands:

```powershell
Remove-Item -Recurse -Force .\\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .\\package-lock.json -ErrorAction SilentlyContinue
npm cache verify
npm install --include=optional --legacy-peer-deps
npm run doctor
```

## Verify Atlas before starting the API

```powershell
npm run db:test
```

Expected output includes:

```text
✓ MongoDB connected successfully
Database: OPSYNQ
Ping: {"ok":1}
```

If this works but Compass fails, the problem is Compass/TLS/network-specific rather than Opsynq.

## Start all three apps

Terminal 1:

```powershell
npm run dev:api
```

Terminal 2:

```powershell
npm run dev:platform
```

Terminal 3:

```powershell
npm run dev:agency
```

Then a fourth terminal:

```powershell
npm run verify:local
```

## Compass TLS troubleshooting

For an Atlas SRV URI (`mongodb+srv://`), TLS is automatically enabled. A `TLSV1_ALERT_INTERNAL_ERROR` is a TLS/network handshake failure rather than an application authentication response.

Check in this order:

1. Atlas cluster is running / not paused.
2. Atlas Network Access contains your **current** public IP. Mobile/ISP public IP addresses can change.
3. Upgrade MongoDB Compass to the current version.
4. In Compass TLS/SSL options, keep TLS on/default for Atlas / use system CA.
5. Disable VPN/proxy temporarily and test.
6. Check antivirus/firewall HTTPS/TLS inspection.
7. Ensure Windows date/time and root certificates are current.
8. Try a different network/hotspot to isolate ISP/router TLS interference.
9. Run `npm run db:test`. If it succeeds, Opsynq is connected even if Compass is not.
