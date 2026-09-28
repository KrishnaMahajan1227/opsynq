const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');let failed=false;
const policyPath=path.join(root,'services/api/security/platformCapabilities.js');
const registryPath=path.join(root,'apps/platform-web/src/layout/moduleRegistry.jsx');
const policy=fs.readFileSync(policyPath,'utf8'),registry=fs.readFileSync(registryPath,'utf8');
const policyCaps=[...policy.matchAll(/'([a-z]+(?:\.[a-z]+)+)'\s*:/g)].map(m=>m[1]);
const registryCaps=[...registry.matchAll(/item\([^\n]+?'([a-z]+(?:\.[a-z]+)+)'\)/g)].map(m=>m[1]);
const missing=[...new Set(registryCaps.filter(x=>!policyCaps.includes(x)))];
if(missing.length){failed=true;console.error('✗ navigation references unknown capabilities:',missing.join(', '));}
else console.log(`✓ capability registry aligned: ${new Set(registryCaps).size} managed capabilities`);
const auth=fs.readFileSync(path.join(root,'services/api/controllers/platform/authController.js'),'utf8');
if(!auth.includes('capabilitiesForRole')){failed=true;console.error('✗ platform auth does not publish role capabilities');}
else console.log('✓ authenticated user payload includes capabilities');
const routes=['operationsRoutes.js','inventoryRoutes.js','logisticsRoutes.js','serviceRoutes.js','governanceRoutes.js','assuranceRoutes.js','automationRoutes.js','searchRoutes.js','teamRoutes.js','regulatoryRoutes.js'];
for(const f of routes){const t=fs.readFileSync(path.join(root,'services/api/routes/platform',f),'utf8');if(!t.includes('rolesFor(')){failed=true;console.error(`✗ ${f} does not use centralized role policy`);}}
if(!failed)console.log('✓ platform route authorization uses centralized role policy');
if(failed)process.exit(1);
