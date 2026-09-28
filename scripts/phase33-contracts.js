const fs=require('fs'),path=require('path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const checks=[
 ['ReplenishmentPlan model present',()=>read('services/api/models/platform/ReplenishmentPlan.js').includes("suggestedQty")&&read('services/api/models/platform/ReplenishmentPlan.js').includes("draftPurchaseOrderId")],
 ['AI provider advisor is backend-only',()=>read('services/api/utils/procurementAdvisor.js').includes('process.env.AI_PROVIDER_API_KEY')&&!read('apps/platform-web/src/core/api.js').includes('AI_PROVIDER_API_KEY')],
 ['AI provider REST uses server API-key header',()=>read('services/api/utils/procurementAdvisor.js').includes("'x-goog-api-key':key")],
 ['replenishment route mounted',()=>read('services/api/server.js').includes("/api/platform/intelligence")&&read('services/api/routes/platform/intelligenceRoutes.js').includes("/replenishment")],
 ['manual procurement approval capability',()=>read('services/api/security/platformCapabilities.js').includes("'procurement.approve':withSuper(['company_owner','company_admin'])")],
 ['draft PO remains manual before issue',()=>read('services/api/controllers/platform/intelligenceController.js').includes("status:'DRAFT'")&&read('services/api/controllers/platform/intelligenceController.js').includes("status='ISSUED'")],
 ['generic approval path enforces Owner/Admin for PO',()=>read('services/api/controllers/platform/assuranceController.js').includes('Only Company Owner/Admin can approve a replenishment purchase order.')],
 ['low-stock notifications target procurement roles',()=>{const s=read('services/api/controllers/platform/intelligenceController.js');return s.includes("inventory_manager")&&s.includes("procurement_manager")&&s.includes("ReplenishmentPlan")}],
 ['agency stock accountability includes receipt exceptions',()=>{const s=read('services/api/controllers/platform/intelligenceController.js');return ['dispatched','received','damaged','missing','receiptRate','issuedToTechnicians'].every(k=>s.includes(k))}],
 ['finance control includes procurement and receivables',()=>{const s=read('services/api/controllers/platform/intelligenceController.js');return ['procurementCommitted','openProcurementCommitment','inventoryBookValue','receivables','claimOutstanding'].every(k=>s.includes(k))}],
 ['replenishment automation scheduled',()=>read('services/api/utils/automationEngine.js').includes('replenishment')],
 ['Phase 33 modules registered',()=>{const s=read('apps/platform-web/src/layout/moduleRegistry.jsx');return ['procurement-intelligence','agency-stock','financial-control'].every(k=>s.includes(k))}],
 ['Phase 33 screens mapped',()=>{const s=read('apps/platform-web/src/features/company/CompanyWorkspace.jsx');return ['ProcurementIntelligencePage','AgencyStockAccountabilityPage','FinancialControlPage'].every(k=>s.includes(k))}],
 ['role dashboard consumes intelligence APIs',()=>{const s=read('apps/platform-web/src/features/company/operations/OperationsPages.jsx');return s.includes("/replenishment")&&s.includes("/finance-control")&&s.includes("/agency-stock")}]
];
let failed=0;for(const[c,fn]of checks){let ok=false;try{ok=!!fn()}catch{}if(ok)console.log('✓',c);else{console.error('✗',c);failed++}}if(failed)process.exit(1);console.log('✓ Phase 33 procurement intelligence + finance control contracts passed');
