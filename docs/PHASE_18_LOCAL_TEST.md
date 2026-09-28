# Phase 18 Local UAT

Keep your existing `.env` files unchanged.

1. Install dependencies from repository root if needed: `npm install --include=optional --legacy-peer-deps`
2. Static/release UAT: `npm run uat:release`
3. Start backend: `npm run backend`
4. Start both frontends in another terminal: `npm run frontend`
5. Runtime UAT: `npm run uat:local`
6. Sign in to Platform Web and enter a Company workspace.
7. Open **System → Readiness & Data Quality**.
8. Confirm the database shows Connected and review critical/warning findings.
9. Use **Open module** from any finding to verify navigation to the owning records.
10. Run normal high-risk flows: Work Package edit/reassignment, Beneficiary import, Stock transfer, Shipment receipt, Technician material issue, Installation serial binding, Service case, Claim update and Team & Access permission changes.

A release should not proceed with unresolved critical data-integrity findings unless the business owner explicitly accepts them.
