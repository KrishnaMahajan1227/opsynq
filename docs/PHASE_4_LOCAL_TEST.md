# Phase 4 local verification

No `.env` changes are required if Phase 3.1 already runs locally.

From the repository root:

```powershell
npm run doctor
npm run dev:api
npm run dev:platform
npm run dev:agency
```

Then in a fourth terminal:

```powershell
npm run verify:local
```

Suggested functional smoke test:
1. Sign in to Platform / Company workspace.
2. Ensure Item Master and Warehouse stock exist.
3. Create an Agency warehouse assigned to an Agency.
4. Add a Driver and Vehicle.
5. Create a shipment with a stocked item.
6. For serial-tracked items, scan/enter exactly the required serials.
7. Dispatch shipment and copy the generated tracking link.
8. Open the tracking link on a mobile browser and allow location access.
9. Open shipment Track view and confirm last location appears/refreshes.
10. Receive the shipment at agency warehouse.
11. Map an existing Agency technician to the Agency.
12. Issue received stock to that technician.
13. Check Reconciliation and Stock views.
