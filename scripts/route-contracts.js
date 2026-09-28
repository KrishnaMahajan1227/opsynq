const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const server=fs.readFileSync(path.join(root,'services/api/server.js'),'utf8');
const mounts=[...server.matchAll(/app\.use\(['\"](\/api\/[^'\"]+)['\"]/g)].map(m=>m[1]);
mounts.push('/api/health');
const files=[];function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(js|jsx)$/.test(e.name))files.push(p)}}
walk(path.join(root,'apps/platform-web/src'));walk(path.join(root,'apps/agency-web/src'));
const refs=new Set();for(const f of files){const t=fs.readFileSync(f,'utf8');for(const m of t.matchAll(/['\"`]((?:\/api\/)[A-Za-z0-9_\-/${}?&.=:[\]]+)/g))refs.add(m[1].split(/[?${]/)[0]);}
const ignored=['/api/health'];const bad=[];for(const ref of refs){if(ignored.some(x=>ref.startsWith(x)))continue;if(!mounts.some(m=>ref.startsWith(m)))bad.push(ref)}
if(bad.length){console.error('✗ Frontend API references without mounted backend prefix:\n'+bad.sort().map(x=>' - '+x).join('\n'));process.exit(1)}
console.log(`✓ API route contract coverage passed (${refs.size} frontend references, ${mounts.length} backend prefixes)`);
