const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ops=read('apps/platform-web/src/features/company/operations/OperationsPages.jsx');
const reg=read('apps/platform-web/src/layout/moduleRegistry.jsx');
const shell=read('apps/platform-web/src/layout/Shell.jsx');
const css=read('apps/platform-web/src/styles/index.css');
const controller=read('services/api/controllers/platform/operationsController.js');
const visibleDelivery=(reg.match(/\{id:'delivery',[\s\S]*?\]\},/)||[''])[0];
const singleDelivery = visibleDelivery.includes("item('programs','Delivery Portfolio'") && !visibleDelivery.includes("item('contracts'") && !visibleDelivery.includes("item('work-orders'") && !visibleDelivery.includes("item('work-packages'");
const hiddenHierarchy = reg.includes('hiddenCompanyModules') && reg.includes("item('work-packages','Work Packages'");
const hiddenActive = shell.includes("['contracts','work-orders','work-packages'].includes(page)?'programs'") && shell.includes("supplyHidden.includes(page)?'supply-chain':page");
const folderPaging = ops.includes('FOLDER_PAGE_SIZE=24') && ops.includes('folderPages') && ops.includes('portfolio-pager');
const agencyPaging = ops.includes('PAGE_SIZE=25') && ops.includes('pageRows=rows.slice');
const recordTable = ops.includes('record-table-panel') && ops.includes('record-table-wrap') && ops.includes('record-table');
const scalableCss = css.includes('Phase 37 — scalable record presentation') && css.includes('.record-table') && css.includes('.table-pager');
const aggregated = controller.includes('$facet') && controller.includes('beneficiaryRollup') && controller.includes('agencyPerformance');
const avoidsN2 = !controller.includes('contracts.filter(cn=>String(cn.programId');
const checks=[
 ['single delivery navigation entry',singleDelivery],
 ['hidden hierarchy routes retained',hiddenHierarchy],
 ['hidden hierarchy keeps delivery nav active',hiddenActive],
 ['folder pagination',folderPaging],
 ['agency pagination',agencyPaging],
 ['package record table styling hook',recordTable],
 ['scalable table CSS',scalableCss],
 ['portfolio metrics aggregation',aggregated],
 ['portfolio avoids per-program array filtering',avoidsN2]
];
let bad=0;for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)bad++}if(bad)process.exit(1);console.log('✓ Phase 37 scalable hierarchy + record UX contracts passed');
