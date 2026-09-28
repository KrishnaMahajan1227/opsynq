const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');let failed=false;
const checks=[
 ['sidebar typography enlarged',read('apps/platform-web/src/styles/index.css').includes('font-size:12.5px!important')],
 ['notification bell mounted',read('apps/platform-web/src/layout/Shell.jsx').includes('function NotificationBell')&&read('apps/platform-web/src/layout/Shell.jsx').includes('/api/platform/governance/notifications')],
 ['notification read endpoint used',read('apps/platform-web/src/layout/Shell.jsx').includes('/read?companyId=${companyId}')],
 ['complete record detail renderer',read('apps/platform-web/src/components/common.jsx').includes('export function SmartRecordDetails')&&read('apps/platform-web/src/features/company/operations/OperationsPages.jsx').includes('<SmartRecordDetails record={selected}/>')],
 ['generic right-side status filters',read('apps/platform-web/src/features/company/operations/OperationsPages.jsx').includes('statusOptions')&&read('apps/platform-web/src/features/company/operations/OperationsPages.jsx').includes('FilterDrawer open={filterOpen}')],
 ['master data retry UX',read('apps/platform-web/src/features/company/configuration/ConfigurationCenter.jsx').includes('Retry')&&read('apps/platform-web/src/features/company/configuration/ConfigurationCenter.jsx').includes('All statuses')],
 ['master data active query hardened',read('services/api/controllers/platform/configurationController.js').includes("req.query.active==='true'||req.query.active==='false'")],
 ['role dashboard visuals',(()=>{const x=read('apps/platform-web/src/features/company/operations/OperationsPages.jsx');return (x.includes('role-dashboard-strip')&&x.includes('css-donut'))||(x.includes('command-dashboard')&&x.includes('command-kpis')&&x.includes('command-panel'))})()],
];
for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed=true}if(failed)process.exit(1);console.log('✓ Phase 27 executive UX contracts passed');
