const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const walk=(dir,pred)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name),pred):pred(path.join(dir,e.name))?[path.join(dir,e.name)]:[]);
let failed=false;
const backend=walk(path.join(root,'services','api'),f=>f.endsWith('.js'));
for(const f of backend){const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status!==0){failed=true;console.error('✗ syntax',path.relative(root,f),'\n',r.stderr)}}
console.log(`✓ backend syntax: ${backend.length} files`);
const registry=fs.readFileSync(path.join(root,'apps/platform-web/src/layout/moduleRegistry.jsx'),'utf8');
const workspace=fs.readFileSync(path.join(root,'apps/platform-web/src/features/company/CompanyWorkspace.jsx'),'utf8');
const ops=fs.readFileSync(path.join(root,'apps/platform-web/src/features/company/operations/OperationsPages.jsx'),'utf8');
const companyPart=(registry.split('export const companyGroups=')[1]||'').split('export const flattenModules')[0]||'';
const navIds=[...companyPart.matchAll(/item\('([^']+)'/g)].map(m=>m[1]);
const combined=workspace+'\n'+ops;
const missing=navIds.filter(id=>!combined.includes(`'${id}'`)&&!combined.includes(`${id}:`));
if(missing.length){failed=true;console.error('✗ company navigation has unresolved screens:',missing.join(', '))}else console.log(`✓ company screen registry: ${navIds.length} navigation targets resolved`);

const appSource=fs.readFileSync(path.join(root,'apps/platform-web/src/App.jsx'),'utf8');
const platformPart=(registry.split('export const platformGroups=')[1]||'').split('export const companyGroups')[0]||'';
const platformIds=[...platformPart.matchAll(/\{id:'([^']+)',label:'[^']+',icon:[^,]+,keywords:/g)].map(m=>m[1]);
const platformMissing=platformIds.filter(id=>!appSource.includes(`'${id}'`));
if(platformMissing.length){failed=true;console.error('✗ platform navigation has unresolved screens:',platformMissing.join(', '))}else console.log(`✓ platform screen registry: ${platformIds.length} navigation targets resolved`);

const shellSource=fs.readFileSync(path.join(root,'apps/platform-web/src/layout/Shell.jsx'),'utf8');
if(!shellSource.includes('sidebar-expand-handle')||!shellSource.includes('setCompact(false)')){failed=true;console.error('✗ sidebar collapse recovery control is missing')}else console.log('✓ sidebar collapse recovery control present');
if(!workspace.includes("'my-workspace':MyWorkspacePage")){failed=true;console.error('✗ My Workspace screen is not registered')}else console.log('✓ My Workspace navigation screen registered');
const searchRoute=fs.readFileSync(path.join(root,'services/api/server.js'),'utf8').includes("/api/platform/search");
if(!searchRoute){failed=true;console.error('✗ platform universal search route is not mounted')}else console.log('✓ platform universal search route mounted');


const stalePermissionRefs=walk(path.join(root,'apps/platform-web/src'),f=>/\.(js|jsx)$/.test(f)).filter(f=>fs.readFileSync(f,'utf8').includes('core/permissions'));
if(stalePermissionRefs.length){failed=true;console.error('✗ stale core/permissions imports remain:',stalePermissionRefs.map(f=>path.relative(root,f)).join(', '))}else console.log('✓ access control imports use accessControl.jsx only');
const farmerModelSource=fs.readFileSync(path.join(root,'services/api/models/Farmer.js'),'utf8');
const finalInspectionBlock=(farmerModelSource.match(/inspectionStatusFinal\s*:\s*\{([\s\S]*?)\n\s*\},/)||[])[1]||'';
if(!finalInspectionBlock.includes("''")||!finalInspectionBlock.includes("default: ''")){failed=true;console.error('✗ Farmer inspectionStatusFinal enum/default contract is invalid')}else console.log('✓ Farmer final-inspection enum/default contract passed');

const frontendJs=walk(path.join(root,'apps'),f=>f.endsWith('.js'));
const jsxInJs=[];
for(const f of frontendJs){
  const src=fs.readFileSync(f,'utf8');
  if(/return\s*\(?\s*<[A-Za-z]|=>\s*\(?\s*<[A-Za-z]|<[A-Z][A-Za-z0-9_.]*[\s>]/.test(src)) jsxInJs.push(path.relative(root,f));
}
if(jsxInJs.length){failed=true;console.error('✗ JSX found inside .js files; rename to .jsx:',jsxInJs.join(', '))}else console.log('✓ no JSX is stored in .js frontend modules');
const demoSeed=path.join(root,'services/api/seed/demoData.js');
const demoMediaDir=path.join(root,'services/api/demo-media');
const demoDocs=[path.join(root,'docs/DEMO_ACCOUNTS.md'),path.join(root,'docs/PHASE_19_DEMO_READINESS.md')];
const demoMedia=fs.existsSync(demoMediaDir)?fs.readdirSync(demoMediaDir).filter(n=>/\.(png|jpe?g|webp)$/i.test(n)):[];
if(!fs.existsSync(demoSeed)||demoMedia.length<6||demoDocs.some(f=>!fs.existsSync(f))){failed=true;console.error('✗ Phase 19 demo assets/seed/docs are incomplete')}else console.log(`✓ Phase 19 demo package present: ${demoMedia.length} field images + seed + account docs`);


const unifiedController=fs.readFileSync(path.join(root,'services/api/controllers/unifiedAuthController.js'),'utf8');
const unifiedRoutes=fs.readFileSync(path.join(root,'services/api/routes/unifiedAuthRoutes.js'),'utf8');
const agencyAppSource=fs.readFileSync(path.join(root,'apps/agency-web/src/App.jsx'),'utf8');
const publicPagesSource=fs.readFileSync(path.join(root,'apps/platform-web/src/features/public/PublicPages.jsx'),'utf8');
const legacyAgencyLoginFile=path.join(root,'apps/agency-web/src/pages/Login.jsx');
if(!unifiedRoutes.includes("/login")||!unifiedRoutes.includes('agency-handoff/exchange')||!unifiedController.includes('randomBytes(32)')||!unifiedController.includes('usedAt')){failed=true;console.error('✗ unified authentication / one-time agency handoff contract is incomplete')}else console.log('✓ unified authentication and one-time agency handoff contract passed');
if(fs.existsSync(legacyAgencyLoginFile)||!agencyAppSource.includes('UnifiedLoginRedirect')||!agencyAppSource.includes('AuthHandoff')||!publicPagesSource.includes('/api/unified-auth/login')){failed=true;console.error('✗ single-login frontend contract is incomplete')}else console.log('✓ single user-facing login contract passed');
const agencySidebar=fs.readFileSync(path.join(root,'apps/agency-web/src/components/AgencySidebar.jsx'),'utf8');
if(!agencySidebar.includes("label: 'Field Work'")||!agencySidebar.includes("label: 'Administration'")||!agencySidebar.includes('agency-sidebar__reopen')){failed=true;console.error('✗ Agency professional navigation shell is incomplete')}else console.log('✓ Agency role-focused navigation shell passed');


const roleNames=['company_owner','company_admin','operations_manager','program_manager','inventory_manager','procurement_manager','finance_user','quality_user','logistics_manager','viewer'];
for(const role of roleNames){
 if(!registry.includes(role)){failed=true;console.error(`✗ role-focused navigation does not reference ${role}`);}
}
if(!registry.includes('groupsForUser')||!shellSource.includes('flattenModulesForUser')){failed=true;console.error('✗ role-filtered module registry is not wired into sidebar/navigation');}else console.log('✓ role-filtered module navigation contract passed');
const notificationModel=fs.readFileSync(path.join(root,'services/api/models/platform/Notification.js'),'utf8');
const governanceController=fs.readFileSync(path.join(root,'services/api/controllers/platform/governanceController.js'),'utf8');
if(!notificationModel.includes('recipientRoles')||!notificationModel.includes('readBy')||!governanceController.includes('notificationAudience')){failed=true;console.error('✗ role-targeted/per-user notification contract is incomplete');}else console.log('✓ role-targeted notification + per-user read-state contract passed');

const forbidden=walk(root,f=>path.basename(f)==='.env'||/^\.env\.(local|production|development)$/.test(path.basename(f)));
if(forbidden.length){failed=true;console.error('✗ real env files found in source package:',forbidden.map(f=>path.relative(root,f)).join(', '))}else console.log('✓ no real .env files packaged');
if(failed)process.exit(1);console.log('✓ Opsynq source sanity checks passed');
