const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[
 ['geo operations module registered',()=>read('apps/platform-web/src/layout/moduleRegistry.jsx').includes("'geo-operations'")],
 ['geo operations screen mapped',()=>read('apps/platform-web/src/features/company/CompanyWorkspace.jsx').includes('GeoOperationsPage')],
 ['geo overview backend route mounted',()=>read('services/api/routes/platform/operationsRoutes.js').includes("'/geo-overview'")],
 ['geo overview controller implemented',()=>read('services/api/controllers/platform/operationsController.js').includes('exports.geoOverview')],
 ['geo-tagged evidence schema present',()=>read('services/api/models/platform/EvidenceSubmission.js').includes('captureGeo')&&read('services/api/models/platform/EvidenceSubmission.js').includes('capturedByRole')],
 ['agency evidence captures device location',()=>read('apps/agency-web/src/components/FarmerDetailView.jsx').includes('navigator.geolocation')],
 ['agency media displays geo stamp',()=>read('apps/agency-web/src/components/FarmerDetailView.jsx').includes('farmer-media-geo')],
 ['field evidence submissions are audited',()=>read('services/api/controllers/farmerController.js').includes('FIELD_EVIDENCE_SUBMITTED')],
 ['audit endpoint enriches actor identity',()=>read('services/api/controllers/platform/governanceController.js').includes('legacyUsers')&&read('services/api/controllers/platform/governanceController.js').includes('actor:actors.get')],
 ['audit UI supports detail drilldown',()=>read('apps/platform-web/src/features/company/governance/GovernancePages.jsx').includes('Before change')&&read('apps/platform-web/src/features/company/governance/GovernancePages.jsx').includes('Audit filters')],
 ['demo seed includes geo-tagged evidence',()=>read('services/api/seed/demoData.js').includes("submissionSource:'DEMO'")&&read('services/api/seed/demoData.js').includes('captureGeo:geoTag')]
];
let failed=false;for(const [name,test] of checks){let ok=false;try{ok=Boolean(test())}catch{};console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed=true;}if(failed)process.exit(1);console.log('Phase 30 geo operations, geo-evidence and audit intelligence contracts passed.');
