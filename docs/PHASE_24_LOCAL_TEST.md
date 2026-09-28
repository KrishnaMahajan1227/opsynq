# Phase 24 Local Test

Keep your existing `services/api/.env` unchanged.

```powershell
npm run seed:full-demo
npm run backend
```

Second terminal:

```powershell
npm run frontend
```

Release validation:

```powershell
npm run qa:release
```

Recommended checks:

1. Open Company workspace and confirm sidebar groups are tightly stacked with no large vertical gaps.
2. Expand one group; confirm its modules appear immediately below it and other groups remain compact.
3. Open Administration > Master Data and inspect seeded records.
4. Open Finance & Assurance > Evidence Control and inspect Survey / Installation / Final Inspection requirements.
5. Open Beneficiary Records, click a row, and verify full detail plus evidence checklist.
6. Open Agency Operations through unified login, open a demo beneficiary, and verify the evidence checklist.
7. Upload/replace a checklist photo and confirm status becomes SUBMITTED.
8. Click table rows in inventory/logistics/service/claims/compliance and verify detail drawers remain within the viewport and scroll internally.
