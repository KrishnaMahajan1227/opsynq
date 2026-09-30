const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const checks=[
  ['Backend env','services/api/.env'],['Backend env example','services/api/.env.example'],['Platform env','apps/platform-web/.env'],['Platform env example','apps/platform-web/.env.example'],['Agency env','apps/agency-web/.env'],['Agency env example','apps/agency-web/.env.example'],['Root node_modules','node_modules'],['Vite binary','node_modules/vite/bin/vite.js'],
];
console.log('\nOpsynq local setup doctor\n');
let warnings=0;
const parts=process.versions.node.split('.').map(Number),nodeOk=(parts[0]===22&&parts[1]>=20)||(parts[0]>=23&&parts[0]<25);console.log(`${nodeOk?'✓':'!'} ${'Node runtime'.padEnd(28)} ${process.version} ${nodeOk?'(supported)':'(Node >=22.20 and <25 required)'}`);if(!nodeOk)warnings++;
for(const[label,rel]of checks){const ok=fs.existsSync(path.join(root,rel));console.log(`${ok?'✓':'!'} ${label.padEnd(28)} ${rel}`);if(!ok&&!rel.endsWith('.env.example'))warnings++;}
function envMap(rel){const file=path.join(root,rel);if(!fs.existsSync(file))return{};const out={};for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){if(!line||/^\s*#/.test(line)||!line.includes('='))continue;const i=line.indexOf('=');out[line.slice(0,i).trim()]=line.slice(i+1).trim()}return out}
const api=envMap('services/api/.env'),platform=envMap('apps/platform-web/.env');
for(const key of ['MONGO_URI','JWT_SECRET']){const v=api[key]||'';const ok=v&&!v.includes('<')&&!v.includes('replace-with');console.log(`${ok?'✓':'!'} ${key.padEnd(28)} ${ok?'configured':'missing / placeholder'}`);if(!ok)warnings++;}
const aiConfigured=Boolean(api.GEMINI_API_KEY||api.AI_PROVIDER_API_KEY);console.log(`${aiConfigured?'✓':'!'} ${'Server AI credential'.padEnd(28)} ${aiConfigured?'configured in API env':'missing from services/api/.env'}`);if(!aiConfigured)warnings++;
const leaked=Boolean(platform.GEMINI_API_KEY||platform.AI_PROVIDER_API_KEY);console.log(`${!leaked?'✓':'!'} ${'Frontend AI secret'.padEnd(28)} ${leaked?'REMOVE: server secret found in frontend env':'not exposed'}`);if(leaked)warnings++;
const mediaDir=path.join(root,'services/api/demo-media');const media=fs.existsSync(mediaDir)?fs.readdirSync(mediaDir).filter(x=>/\.(png|jpe?g|webp)$/i.test(x)).length:0;const mediaOk=media>=6;console.log(`${mediaOk?'✓':'!'} ${'Demo field media'.padEnd(28)} ${media} images`);if(!mediaOk)warnings++;
console.log('\nNext checks:');console.log('  npm run db:test        # verify MongoDB');console.log('  npm run build:all      # build Platform + Agency');console.log('  npm run backend        # API');console.log('  npm run frontend       # Platform + Agency UIs');console.log('  npm run verify:local   # runtimes');console.log('  npm run demo:verify    # all demo roles + scopes + RMS/reports + AI');
console.log(`\n${warnings?'Resolve the warnings above before client demo.':'Local dependency/config checks look ready for client demo.'}\n`);process.exitCode=warnings?1:0;
