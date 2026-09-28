const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');let failed=false;
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const dashboard=read('apps/platform-web/src/features/company/operations/OperationsPages.jsx');
const registry=read('apps/platform-web/src/layout/moduleRegistry.jsx');
const policy=read('services/api/security/platformCapabilities.js');
const platform=read('apps/platform-web/src/features/platform/PlatformPages.jsx');
const agencyCss=read('apps/agency-web/src/pages/AdminEnterprise.css');
const roles=['company_owner','company_admin','operations_manager','program_manager','inventory_manager','procurement_manager','finance_user','quality_user','logistics_manager','viewer'];
for(const role of roles){
 if(!dashboard.includes(`${role}:`)){failed=true;console.error(`✗ Phase 31 dashboard missing role composition for ${role}`)}
 if(!registry.includes(`${role}:'company-overview'`)){failed=true;console.error(`✗ ${role} does not land on its role dashboard`)}
}
for(const marker of ['Inventory Control','Procurement Control','Commercial Control','Quality & Service','Logistics Control','Execution pipeline','District execution','command-kpis','command-panel'])if(!dashboard.includes(marker)){failed=true;console.error(`✗ dashboard marker missing: ${marker}`)}
if(!policy.includes("'overview.read':withSuper(ALL_COMPANY_ROLES)")){failed=true;console.error('✗ role dashboard API is not available to every company role')}
if(!platform.includes('Global Command')||!platform.includes('command-kpis')){failed=true;console.error('✗ Platform Superadmin dashboard was not migrated to the command dashboard system')}
if(!agencyCss.includes('Phase 31 — unified restrained dashboard presentation')){failed=true;console.error('✗ Agency dashboard presentation contract missing')}
if(!failed)console.log('✓ Phase 31 role dashboard + restrained UI contracts passed');
if(failed)process.exit(1);
