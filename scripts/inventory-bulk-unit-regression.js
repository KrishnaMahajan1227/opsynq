const fs=require('fs');
const read=p=>fs.readFileSync(p,'utf8');
const c=read('services/api/controllers/platform/inventoryController.js');
const r=read('services/api/routes/platform/inventoryRoutes.js');
const u=read('apps/platform-web/src/features/company/inventory/InventoryPages.jsx');
const checks=[
 ['tenant-scoped hard delete impact',c.includes('async function itemDeleteImpact(companyId,itemId)')&&c.includes('companyId,itemId')],
 ['admin-only permanent item delete',c.includes("['platform_superadmin','company_owner','company_admin'].includes(req.platformUser.role)")],
 ['delete blocked by dependencies',c.includes('ITEM_DELETE_BLOCKED_BY_DEPENDENCIES')],
 ['delete is audited',c.includes("action:'INVENTORY_ITEM_DELETED'")],
 ['delete impact and delete routes',r.includes("/items/:id/delete-impact")&&r.includes("router.delete('/items/:id'")],
 ['batch-tracked receipt validation',c.includes('requires a batch number')],
 ['direct receive stock UX',u.includes('Receive stock / add units')&&u.includes('QuickStockReceiptModal')],
 ['rapid scan and manual bulk entry',u.includes('Scan next serial / barcode')&&u.includes('paste 100 values here')],
 ['scanner duplicate protection',u.includes('already exists in inventory')&&u.includes('Duplicate serial/barcode values are present')],
 ['unused delete confirmation',u.includes("requireText:'DELETE'")&&u.includes('Delete unused')]
];
let failed=0;for(const[n,ok]of checks){console.log(`${ok?'✓':'✗'} ${n}`);if(!ok)failed++;}if(failed)process.exit(1);
