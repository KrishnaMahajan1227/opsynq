const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const active=path.join(root,'apps/platform-web/src/features/company/configuration/ConfigurationCenter.jsx');
const shim=path.join(root,'apps/platform-web/src/features/company/configuration/ConfigurationPages.jsx');
const workspace=path.join(root,'apps/platform-web/src/features/company/CompanyWorkspace.jsx');
const text=fs.readFileSync(active,'utf8');
const ws=fs.readFileSync(workspace,'utf8');
const shimText=fs.readFileSync(shim,'utf8');
const start=text.indexOf('export function EvidenceControlPage');
const end=text.indexOf('function EvidenceModal',start);
if(start<0||end<0){console.error('✗ EvidenceControlPage contract missing');process.exit(1)}
const block=text.slice(start,end);
const forbidden=['setType(','setDomain(','domain]','[domain','type]','[type'];
const hits=forbidden.filter(x=>block.includes(x));
if(hits.length){console.error('✗ EvidenceControlPage still references foreign Master Data state:',hits.join(', '));process.exit(1)}
for(const required of ['evidenceType','required','setRequired','setEvidenceType','setStage','setActive']){
  if(!block.includes(required)){console.error(`✗ EvidenceControlPage missing ${required}`);process.exit(1)}
}
if(!ws.includes("./configuration/ConfigurationCenter.jsx")){console.error('✗ CompanyWorkspace is not using the explicit ConfigurationCenter.jsx module');process.exit(1)}
if(!shimText.includes("from './ConfigurationCenter.jsx'")){console.error('✗ ConfigurationPages compatibility shim is not safe');process.exit(1)}
console.log('✓ EvidenceControlPage runtime-state contract passed');
console.log('✓ Configuration workspace uses explicit non-stale module path');
