# Phase 15 local test

1. Keep your existing `.env` files exactly as configured.
2. From the repository root run backend: `npm run backend`
3. In a second terminal run all frontends: `npm run frontend`
4. Validate source/release contracts: `npm run qa:release`
5. Sign in and open a Company workspace. It should land on Action Center.
6. Expand/collapse every sidebar heading, use Find module, Ctrl/Cmd+K, compact mode and mobile-width drawer.
7. Navigate repeatedly between Work Packages, Beneficiary Imports, Item Master, Warehouses, Approval Center, Service Cases and Automation. No `destroy is not a function` error should occur.
8. Confirm Action Center cards open their corresponding modules.
9. Run `npm run smoke:local` after both frontend and backend are running.
