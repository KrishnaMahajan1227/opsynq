const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');let failed=false;
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(root).filter(f=>!f.includes(`${path.sep}node_modules${path.sep}`)&&!f.endsWith('.zip'));
const markers=[];for(const f of files.filter(f=>/\.(js|jsx|md|json)$/.test(f)&&path.basename(f)!=='release-gate.js')){const t=fs.readFileSync(f,'utf8');if(/\b(TODO|FIXME|HACK|XXX)\b/.test(t))markers.push(path.relative(root,f));}
if(markers.length){failed=true;console.error('✗ unresolved release markers:',markers.join(', '));}else console.log('✓ no TODO/FIXME/HACK release markers');
for(const rel of ['package.json','services/api/package.json','apps/platform-web/package.json','apps/agency-web/package.json']){try{JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'))}catch(e){failed=true;console.error(`✗ invalid ${rel}: ${e.message}`)}}
if(!failed)console.log('✓ package manifests valid');
const required=['/api/health/live','/api/health/ready','/api/health/version'];const server=fs.readFileSync(path.join(root,'services/api/server.js'),'utf8');const miss=required.filter(x=>!server.includes(x));if(miss.length){failed=true;console.error('✗ missing production health endpoints:',miss.join(', '))}else console.log('✓ live/ready/version health endpoints present');
if(failed)process.exit(1);console.log('✓ Opsynq Phase 33 release gate passed');
