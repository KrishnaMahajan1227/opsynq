const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[
 ['dense top-stacked accordion',read('apps/platform-web/src/styles/index.css').includes('.nav-groups{display:block!important')],
 ['universal detail drawer',read('apps/platform-web/src/components/common.jsx').includes('export function DetailDrawer')],
 ['master data screen registered',read('apps/platform-web/src/layout/moduleRegistry.jsx').includes("item('master-data'")],
 ['evidence control screen registered',read('apps/platform-web/src/layout/moduleRegistry.jsx').includes("item('evidence-control'")],
 ['configuration API mounted',read('services/api/server.js').includes("/api/platform/configuration")],
 ['master data model present',fs.existsSync(path.join(root,'services/api/models/platform/MasterDataEntry.js'))],
 ['evidence requirement model present',fs.existsSync(path.join(root,'services/api/models/platform/EvidenceRequirement.js'))],
 ['evidence submission model present',fs.existsSync(path.join(root,'services/api/models/platform/EvidenceSubmission.js'))],
 ['agency evidence submission endpoint',read('services/api/routes/farmerRoutes.js').includes("/:id/evidence/:requirementId")],
 ['agency evidence checklist UI',read('apps/agency-web/src/components/FarmerDetailView.jsx').includes('EvidenceChecklist')],
 ['beneficiary detail includes evidence matrix',read('services/api/controllers/platform/operationsController.js').includes('evidenceChecklist')],
];
let fail=false;for(const[c,ok]of checks){if(ok)console.log('✓ '+c);else{console.error('✗ '+c);fail=true}}if(fail)process.exit(1);console.log('✓ Phase 24 UX + evidence contracts passed');
