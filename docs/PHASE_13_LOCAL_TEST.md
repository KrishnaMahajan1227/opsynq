# Phase 13 Local Test

1. Keep your existing `.env` files unchanged.
2. Run `npm run qa:source`.
3. Start API: `npm run backend`.
4. Start both frontends: `npm run frontend`.
5. Open Company workspace.
6. Verify every sidebar group can expand/collapse and every listed module opens.
7. Type in `Find module…` and verify module filtering.
8. Press `Ctrl+K` and jump to modules from the command palette.
9. Verify sidebar itself scrolls through all modules without hiding account/logout.
10. Use `Search records…` with a Work Order number, Work Package code, serial/barcode, shipment number, claim number, service case, agency or beneficiary.
11. Resize to tablet/mobile width and verify the icon rail preserves access to all modules.
12. Run `npm run verify:local` while all services are running.
