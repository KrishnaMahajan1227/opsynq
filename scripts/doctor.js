const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const checks=[
  ['Backend env','services/api/.env'],
  ['Backend env example','services/api/.env.example'],
  ['Platform env','apps/platform-web/.env'],
  ['Platform env example','apps/platform-web/.env.example'],
  ['Agency env','apps/agency-web/.env'],
  ['Agency env example','apps/agency-web/.env.example'],
  ['Root node_modules','node_modules'],
  ['Vite binary','node_modules/vite/bin/vite.js'],
  ['Rollup Windows binary','node_modules/@rollup/rollup-win32-x64-msvc/package.json'],
];
console.log('\nOpsynq local setup doctor\n');
let warnings=0;
for(const [label,rel] of checks){const ok=fs.existsSync(path.join(root,rel));console.log(`${ok?'✓':'!'} ${label.padEnd(28)} ${rel}`);if(!ok && !rel.endsWith('.env.example')) warnings++;}
const envPath=path.join(root,'services/api/.env');
if(fs.existsSync(envPath)){
 const txt=fs.readFileSync(envPath,'utf8');
 for(const key of ['MONGO_URI','JWT_SECRET']){const m=txt.match(new RegExp(`^${key}=(.+)$`,'m'));const ok=m&&m[1]&&!m[1].includes('<')&&!m[1].includes('replace-with');console.log(`${ok?'✓':'!'} ${key.padEnd(28)} ${ok?'configured':'missing / placeholder'}`);if(!ok)warnings++;}
}
console.log('\nNext checks:');
console.log('  npm run db:test       # verify Atlas independently of Compass');
console.log('  npm run backend       # complete API/backend');
console.log('  npm run frontend      # Platform + Agency UIs together');
console.log('  npm run verify:local  # verify all three runtimes');
console.log(`\n${warnings?'Resolve the warnings above before starting all services.':'Local dependency/config checks look ready.'}\n`);
process.exitCode=warnings?1:0;
