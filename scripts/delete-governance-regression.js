const fs=require('fs');
const path=require('path');
const read=p=>fs.readFileSync(path.join(process.cwd(),p),'utf8');
const checks=[
 ['central delete governance exists',read('services/api/utils/deleteGovernance.js').includes('beneficiaryDependencySummary')],
 ['beneficiary dependencies include inventory/RMS/material receipts',/BeneficiaryMaterialReceipt/.test(read('services/api/utils/deleteGovernance.js'))&&/InventorySerial/.test(read('services/api/utils/deleteGovernance.js'))&&/RmsDevice/.test(read('services/api/utils/deleteGovernance.js'))],
 ['agency single delete has impact route',read('services/api/routes/farmerRoutes.js').includes("/:id/delete-impact")],
 ['agency bulk delete exists',read('services/api/routes/farmerRoutes.js').includes("delete('/bulk'")],
 ['agency delete all superadmin exists',read('services/api/routes/farmerRoutes.js').includes("delete('/all'")],
 ['company single delete impact exists',read('services/api/routes/platform/operationsRoutes.js').includes("/:farmerId/delete-impact")],
 ['company bulk delete impact exists',read('services/api/routes/platform/operationsRoutes.js').includes("/beneficiaries/delete-impact")],
 ['company delete all exists',read('services/api/routes/platform/operationsRoutes.js').includes("/beneficiaries/all")],
 ['delete all requires phrase',read('services/api/controllers/platform/operationsController.js').includes("confirm!=='DELETE ALL'")&&read('services/api/controllers/farmerController.js').includes("confirm!=='DELETE ALL'")],
 ['user delete impact and dependency block exist',read('services/api/routes/userRoutes.js').includes("/:id/delete-impact")&&read('services/api/controllers/userController.js').includes('userDependencySummary')],
 ['user delete requires reason and audit log',read('services/api/controllers/userController.js').includes("Deletion reason is required")&&read('services/api/controllers/userController.js').includes("changeType:'user_deletion'")],
 ['agency confirm supports typed confirmation',read('apps/agency-web/src/utils/confirmAction.js').includes('requireText')],
 ['platform confirm supports typed confirmation',read('apps/platform-web/src/components/common.jsx').includes('requireText')],
 ['company beneficiary delete uses preflight',read('apps/platform-web/src/features/company/operations/OperationsPages.jsx').includes('/delete-impact')],
 ['agency beneficiary delete uses preflight',read('apps/agency-web/src/pages/DashboardAdmin.jsx').includes('/delete-impact')&&read('apps/agency-web/src/pages/DashboardSuperAdmin.jsx').includes('/delete-impact')],
 ['agency user delete uses preflight',read('apps/agency-web/src/components/AgencyTeamAccessPanel.jsx').includes('/delete-impact')],
 ['package beneficiary count recalculated after agency delete',read('services/api/controllers/farmerController.js').includes('assignedQuantity:count')],
 ['company delete remains audited',read('services/api/controllers/platform/operationsController.js').includes('BENEFICIARY_BULK_DELETED')&&read('services/api/controllers/platform/operationsController.js').includes('BENEFICIARY_DELETE_ALL')],
];
let fail=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)fail++}console.log(`Delete governance: ${checks.length-fail}/${checks.length}`);if(fail)process.exit(1);
