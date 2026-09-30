const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const targets=['apps/agency-web/src/assets/logo-helioops.png','apps/agency-web/src/assets/logo-opsynq.png','apps/agency-web/public/vite.svg'];
for(const rel of targets){const file=path.join(root,rel);if(fs.existsSync(file)){fs.rmSync(file,{force:true});console.log(`Removed ${rel}`)}else console.log(`Already absent ${rel}`)}
console.log('✓ Agency static branding assets cleaned. Operational/evidence images were preserved.');
