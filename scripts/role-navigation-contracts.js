const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const registry=fs.readFileSync(path.join(root,'apps/platform-web/src/layout/moduleRegistry.jsx'),'utf8');
const shell=fs.readFileSync(path.join(root,'apps/platform-web/src/layout/Shell.jsx'),'utf8');
const policy=fs.readFileSync(path.join(root,'services/api/security/platformCapabilities.js'),'utf8');
let failed=false;
const requiredRoles=['company_owner','company_admin','operations_manager','program_manager','inventory_manager','procurement_manager','finance_user','quality_user','logistics_manager','viewer'];
for(const role of requiredRoles){if(!registry.includes(`${role}:`)){failed=true;console.error(`✗ missing exact module map for ${role}`)}}
if(registry.includes('MANAGEMENT_READ')||registry.includes('ASSET_READ')||registry.includes('SERVICE_READ')){failed=true;console.error('✗ broad legacy role groups still present in module registry')}
if(shell.includes('View-only access')||shell.includes('nav-readonly')||shell.includes('workspace-readonly')){failed=true;console.error('✗ view-only navigation UX is still present')}
if(!shell.includes('if(compact){setCompact(false)')){failed=true;console.error('✗ compact group icon does not reopen sidebar')}
if(!policy.includes("'overview.read'")){failed=true;console.error('✗ backend overview role scope is missing')}
if(!failed)console.log('✓ strict role navigation + compact sidebar contracts passed');
if(failed)process.exit(1);
