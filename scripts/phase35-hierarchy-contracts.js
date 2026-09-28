const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ops=read('apps/platform-web/src/features/company/operations/OperationsPages.jsx');
const geo=read('apps/platform-web/src/features/company/geo/GeoOperationsPage.jsx');
const routes=read('services/api/routes/platform/operationsRoutes.js');
const controller=read('services/api/controllers/platform/operationsController.js');
const context=read('services/api/models/platform/BeneficiaryContext.js');
const farmer=read('services/api/models/Farmer.js');
const checks=[
 ['portfolio hierarchy UI',ops.includes('Program → Contract → Work Order → Work Package → Beneficiary')&&ops.includes('portfolio-folder')],
 ['direct work order folder',ops.includes('Direct / No Contract')],
 ['package beneficiary preview',ops.includes('Beneficiaries in this work package')],
 ['agency execution linkage',ops.includes('Execution folders')&&ops.includes('linkedBeneficiaries')],
 ['beneficiary hierarchy filters',ops.includes('Beneficiary & delivery filters')&&ops.includes('contractId')&&ops.includes('workPackageId')&&ops.includes('taluka')],
 ['import hierarchy context',ops.includes('Bulk intake follows the same Program → Contract/LOA → Work Order')],
 ['geo hierarchy filters',geo.includes('Geo & delivery filters')&&geo.includes('workPackageId')&&geo.includes('agencyId')],
 ['portfolio API mounted',routes.includes("router.get('/portfolio'")],
 ['filter options API mounted',routes.includes("router.get('/beneficiary-filter-options'")],
 ['portfolio aggregation controller',controller.includes('exports.portfolioOverview')&&controller.includes('beneficiaryGroups')],
 ['beneficiary cross filters backend',controller.includes('req.query.contractId')&&controller.includes('req.query.state')&&controller.includes('req.query.scheme')],
 ['beneficiary context indexes',context.includes('workOrderId:1,workPackageId:1')],
 ['farmer geography indexes',farmer.includes('district: 1, taluka: 1, village: 1')]
];
let bad=0;for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)bad++}if(bad)process.exit(1);console.log('✓ Phase 35 delivery hierarchy + cross-filter contracts passed');
