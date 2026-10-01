# Agency + Technician final UI/media/panel-scan pass — 2026-10-01

## Fixed
- Evidence checklist now renders photo/signature thumbnails and document cards instead of raw evidence links.
- Field-verification media always passes through the production asset URL resolver.
- Installation inspection detail Bootstrap column widths are reset inside a responsive 4/3/2/1-column layout; cards no longer collapse into narrow strips.
- Material receipt has an explicit solar-panel serial scanner (manual/USB-Bluetooth input + camera BarcodeDetector when supported).
- Installation has a dedicated solar-panel serial scanner with the same server-side beneficiary/technician inventory validation.
- Receipt-captured panel serials remain on the Farmer record and are prefilled for installation; installation performs the final inventory reconciliation again.
- LR logistics photos render as image thumbnails instead of URL links.
- Zero issued-inventory state clearly distinguishes legacy/prefilled serials from inventory-confirmed serials.
- Agency/Technician modals, accordions, tables, controls, alerts, loading states and field-verification media cards share one restrained operational design system.

## Validation
- `node scripts/jsx-syntax.js`
- `node scripts/effect-contracts.js`
- `node scripts/permission-contracts.js`
- `node scripts/role-navigation-contracts.js`
- `node scripts/route-contracts.js`
- `node scripts/phase28-contracts.js`
- `node scripts/phase40-professional-ux-contracts.js`
- `node scripts/phase41-ai-agency-contracts.js`
- `node scripts/phase42-ui-stability-contracts.js`
- `node scripts/phase49-dashboard-performance-contracts.js`
- `node scripts/phase53-geo-receipt-scanner-contracts.js`
- `node scripts/data-integrity-contracts.js`
- `node scripts/agency-final-contracts.js`
- `node scripts/agency-production-flow-contracts.js`
- `node scripts/agency-map-refresh-regression.js`
- `node scripts/final-field-receipt-service-sync-regression.js`
- `node scripts/final-agency-tech-ui-regression.js` (13/13)

## Existing baseline-only source sanity findings
The input package already contains these unrelated platform findings and this pass does not modify them:
- `apps/platform-web/src/core/permissions.js` contains JSX in a `.js` file.
- Existing single-login frontend source-sanity contract remains incomplete.
