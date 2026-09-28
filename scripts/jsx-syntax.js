const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const roots=[path.join(root,'apps/platform-web/src'),path.join(root,'apps/agency-web/src')];
const files=[];const walk=d=>{if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(jsx|js)$/.test(e.name))files.push(p)}};roots.forEach(walk);
let esbuild=null,ts=null;
try{esbuild=require('esbuild')}catch{}
if(!esbuild){try{ts=require('typescript')}catch{};
 if(!ts){for(const candidate of ['/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js','/usr/local/lib/node_modules/typescript/lib/typescript.js']){try{ts=require(candidate);break}catch{}}}}
if(!esbuild&&!ts){console.error('✗ No JSX parser available. Run npm install so Vite/esbuild dependencies are present.');process.exit(1)}
let failed=false;
for(const f of files){const text=fs.readFileSync(f,'utf8');
 try{
  if(esbuild)esbuild.transformSync(text,{loader:f.endsWith('.jsx')?'jsx':'js',jsx:'automatic',sourcefile:f,logLevel:'silent'});
  else{const sf=ts.createSourceFile(f,text,ts.ScriptTarget.Latest,true,f.endsWith('.jsx')?ts.ScriptKind.JSX:ts.ScriptKind.JS);const errs=sf.parseDiagnostics||[];if(errs.length){failed=true;for(const e of errs){const pos=sf.getLineAndCharacterOfPosition(e.start||0);console.error(`✗ ${path.relative(root,f)}:${pos.line+1}:${pos.character+1} ${ts.flattenDiagnosticMessageText(e.messageText,' ')}`)}}}
 }catch(e){failed=true;console.error(`✗ ${path.relative(root,f)}: ${e.message}`)}
}
if(failed)process.exit(1);console.log(`✓ frontend syntax parsed: ${files.length} JS/JSX files`);
