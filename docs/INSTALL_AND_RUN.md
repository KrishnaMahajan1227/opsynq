# Opsynq — Local Install & Run

## 1. Requirements
- Node.js 20+ (Node 22 is fine)
- npm 10+
- MongoDB Atlas or MongoDB connection string
- Internet access for the first `npm install`

## 2. Install once from the repository root
Open a terminal in the folder that contains the root `package.json` (the `opsynq/` folder):

```bash
npm install
```

Do **not** run separate `npm install` commands inside `apps/platform-web`, `apps/agency-web`, or `services/api`. The repository uses npm workspaces, so the root install resolves all three applications.

## 3. Environment files
Create the files below from their `.env.example` files.

### Backend
`services/api/.env`

Required at minimum:

```env
PORT=3000
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER/OPSYNQ?retryWrites=true&w=majority
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=12h
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174
```

For first Platform Superadmin bootstrap also set:

```env
PLATFORM_SUPERADMIN_NAME=Opsynq Platform Superadmin
PLATFORM_SUPERADMIN_EMAIL=you@example.com
PLATFORM_SUPERADMIN_MOBILE=9999999999
PLATFORM_SUPERADMIN_PASSWORD=use-a-strong-password
```

### Platform frontend
`apps/platform-web/.env`

```env
VITE_API_URL=http://localhost:3000
```

### Agency frontend
`apps/agency-web/.env`

Use the values from `apps/agency-web/.env.example`. The API/socket server should point to `http://localhost:3000` for local development.

## 4. Run configuration doctor
From repository root:

```bash
npm run doctor
```

It checks whether required local env files and the root install exist. It does not print secrets.

## 5. Seed the first Platform Superadmin
Run once after the backend `.env` is configured:

```bash
npm --workspace services/api run seed:platform
```

## 6. Start Opsynq locally
Use **three terminals**, all opened in the repository root.

Terminal 1 — backend:

```bash
npm run dev:api
```

Expected important lines:

```text
MongoDB connected
Server running on port 3000
```

Test backend directly:

```text
http://localhost:3000/api/health
```

Expected JSON includes `"ok": true`.

Terminal 2 — Platform / Company web:

```bash
npm run dev:platform
```

Vite normally opens/prints:

```text
http://localhost:5173
```

Terminal 3 — existing Agency Operations web:

```bash
npm run dev:agency
```

With Platform already occupying 5173, Vite normally uses:

```text
http://localhost:5174
```

If Vite selects another port, use the exact URL printed in that terminal and add the origin to `CLIENT_ORIGIN` in the backend `.env`, comma separated.

## 7. Verify all three services
After all three are running:

```bash
npm run verify:local
```

It checks:
- Backend: `http://localhost:3000/api/health`
- Platform: `http://localhost:5173`
- Agency: `http://localhost:5174`

## 8. Functional smoke test
1. Open Platform UI and sign in as Platform Superadmin.
2. Create/approve a test company or open an approved company.
3. Open Company Operations.
4. Create Program -> Contract/LOA -> Work Order -> Agency -> Work Package.
5. Bulk import a small beneficiary Excel into an agency-assigned package.
6. Open Inventory -> create an Item -> create a Warehouse -> create a Purchase Order -> Receive Goods.
7. Confirm Stock & Transfers shows the received quantity.
8. For a serial-tracked item, receive serial/barcode values and test Barcode / Serial Scan.
9. Open Agency UI and verify the existing Farmer / Survey / Installation workflows still load.

## Troubleshooting
### Backend cannot connect to MongoDB
- Verify Atlas Network Access permits your current IP.
- Verify username/password and database URI.
- URL-encode special characters in MongoDB usernames/passwords when necessary.

### Browser shows CORS error
Add the exact frontend origin printed by Vite to `CLIENT_ORIGIN` in `services/api/.env`, then restart the API.

### 401 / session errors
Clear Opsynq localStorage in the browser and sign in again after changing JWT settings.

### 403 on inventory actions
The logged-in company role may be read-only. Inventory/procurement mutation permissions are enforced by the backend.

## Windows recovery for Rollup / missing dev dependency

If you see `@rollup/rollup-win32-x64-msvc` missing or an old `nodemon` error, use:

```powershell
npm run clean:install
npm cache verify
npm install
npm run doctor
npm run seed:platform
```

Then start API, Platform and Agency from three terminals. See `docs/WINDOWS_LOCAL_RECOVERY.md`.
