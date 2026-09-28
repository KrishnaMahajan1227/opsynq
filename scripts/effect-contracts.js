const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const roots=[path.join(root,'apps','platform-web','src'),path.join(root,'apps','agency-web','src')];
const bad=[];
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(js|jsx)$/.test(e.name)){const t=fs.readFileSync(p,'utf8');for(const m of t.matchAll(/useEffect\(\s*([A-Za-z_$][\w$]*)\s*,/g))bad.push(`${path.relative(root,p)}: useEffect(${m[1]}, ...) is forbidden; wrap the call so a Promise/object cannot become React cleanup`);if(/useEffect\(\s*async\s*\(/.test(t)||/useEffect\(\s*async\s+[A-Za-z_$]/.test(t))bad.push(`${path.relative(root,p)}: async useEffect callback is forbidden`)}}}
roots.forEach(walk);
if(bad.length){console.error('Effect contract check failed:\n'+bad.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('✓ React effect cleanup contracts passed');
