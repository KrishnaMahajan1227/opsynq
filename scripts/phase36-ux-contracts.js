const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ops=read('apps/platform-web/src/features/company/operations/OperationsPages.jsx');
const shell=read('apps/platform-web/src/layout/Shell.jsx');
const workspace=read('apps/platform-web/src/features/company/CompanyWorkspace.jsx');
const controller=read('services/api/controllers/platform/operationsController.js');
const css=read('apps/platform-web/src/styles/index.css');
const checks=[
 ['hierarchy nav sync', ops.includes('__hierarchyDrill') && workspace.includes('isHierarchyDrill') && ops.includes("setContext('contracts'") && ops.includes("setContext('work-orders'") && ops.includes("setContext('work-packages'")],
 ['workspace breadcrumbs', shell.includes('workspace-breadcrumbs') && shell.includes('navTrail') && css.includes('.workspace-breadcrumbs')],
 ['compact hierarchy breadcrumbs', ops.includes('compact-trail') && ops.includes('slice(-4)')],
 ['hierarchy record summaries', ops.includes('portfolio-level-summary') && ops.includes('portfolio-folder-meta') && css.includes('.portfolio-level-summary')],
 ['agency performance metrics', controller.includes('completionPercent') && controller.includes('pendingSurvey') && controller.includes('blockedPackages')],
 ['agency performance workspace', ops.includes('agency-summary-strip') && ops.includes('Beneficiary progress') && ops.includes('Issues / blockers')],
 ['beneficiary chain shows contract/package', ops.includes("x.workOrderId?.contractId?.number") && ops.includes("x.workPackageId?.code")]
];
let bad=0;
for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)bad++}
if(bad)process.exit(1);
console.log('✓ Phase 36 hierarchy continuity + record UX contracts passed');
