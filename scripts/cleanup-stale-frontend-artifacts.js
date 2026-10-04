const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const targets=[
  path.join(root,'apps','platform-web','src','core','permissions.js'),
  path.join(root,'apps','agency-web','src','pages','Login.jsx'),
];

for(const file of targets){
  if(!fs.existsSync(file)) continue;
  fs.rmSync(file,{force:true});
  console.log(`✓ removed stale frontend artifact: ${path.relative(root,file)}`);
}
console.log('✓ stale frontend artifact cleanup complete');
