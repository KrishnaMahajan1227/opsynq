# Phase 5 Local Smoke Test

Start from the Opsynq root with your existing environment files unchanged.

```powershell
npm run dev:api
npm run dev:platform
npm run dev:agency
```

Then run:

```powershell
npm run verify:local
```

## Recommended test sequence
1. Platform > Item Master: create serial-tracked Pump, Motor, Controller and Panel items and set the correct Installation Role.
2. Receive serialized stock through GRN.
3. Move/ship stock to an Agency warehouse.
4. Receive the shipment using the receipt form. Test POD photo/signature and, separately, a partial/damaged/missing case.
5. Map an existing Agency technician to the Agency.
6. Issue serialized material to that technician, ideally linked to the relevant farmer/work package.
7. Login to Agency Web as that technician.
8. Open an assigned mapped farmer installation.
9. Confirm the `Issued Material` section appears in the installation modal.
10. Use the issued serials and complete installation.
11. Platform > Installed Assets: confirm the serials appear against the farmer and state is ACTIVE.
12. Platform > Asset Lifecycle: confirm installation events and warranty dates.
13. Test an unused issued serial return.
14. Test replacement using another issued serial of the same item.
15. Platform > Reconciliation: confirm damaged/missing states are visible.

## Negative tests
- Try a serial issued to another technician: must be rejected.
- Try a serial from another Agency: must be rejected.
- Try the same serial twice: must be rejected.
- Try an already installed serial: must be rejected.
- Try receipt quantities greater than remaining shipment quantity: must be rejected.
- For serialized shipment receipt, omit one serial code: must be rejected.
