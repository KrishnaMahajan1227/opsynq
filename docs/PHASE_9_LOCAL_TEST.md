# Phase 9 Local Verification

1. Keep your existing `.env` files unchanged.
2. From repository root run `npm install --include=optional --legacy-peer-deps` only if dependencies are not already installed.
3. Run `npm run seed` once/repeat-safely.
4. Terminal 1: `npm run backend`
5. Terminal 2: `npm run frontend`
6. Run `npm run verify:local`.
7. Sign in to Platform Web, enter a Company workspace, open **Automation & Health**.
8. Verify Database = connected and run each manual control once.
9. Confirm Automation history records COMPLETED and Notifications shows any generated operational warnings.
10. Optional CLI full cycle: `npm run automation:run`.
11. Optional operational snapshot: `npm run snapshot -- <companyObjectId>`.

The scheduler automatically starts after the API connects to MongoDB and runs every 15 minutes. A MongoDB lease prevents another API process from running the same company/job concurrently.
