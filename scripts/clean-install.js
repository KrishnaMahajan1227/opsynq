const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const targets=['node_modules','apps/platform-web/node_modules','apps/agency-web/node_modules','apps/platform-web/dist','apps/agency-web/dist'];
for(const rel of targets){const target=path.join(root,rel);if(fs.existsSync(target)){console.log(`Removing ${target}`);fs.rmSync(target,{recursive:true,force:true})}}
if(!fs.existsSync(path.join(root,'package-lock.json'))){console.error('package-lock.json is missing. Restore it before installing dependencies.');process.exit(1)}
console.log('✓ Cleaned generated install/build artifacts and preserved package-lock.json.');
console.log('Next: npm ci');
