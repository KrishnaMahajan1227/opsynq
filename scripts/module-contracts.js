const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const srcRoots=[path.join(root,'apps','platform-web','src'),path.join(root,'apps','agency-web','src')];
const exts=['.js','.jsx'];
const failures=[];
function files(dir){if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):(exts.includes(path.extname(e.name))?[path.join(dir,e.name)]:[]));}
function resolveLocal(from,spec){if(!spec.startsWith('.'))return null;const base=path.resolve(path.dirname(from),spec);for(const c of [base,...exts.map(x=>base+x),...exts.map(x=>path.join(base,'index'+x))])if(fs.existsSync(c)&&fs.statSync(c).isFile())return c;return null;}
function exportsOf(text){const out=new Set();for(const m of text.matchAll(/export\s+(?:(?:async\s+)?function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g))out.add(m[1]);for(const m of text.matchAll(/export\s*\{([^}]+)\}/g)){m[1].split(',').forEach(part=>{const bits=part.trim().split(/\s+as\s+/);if(bits[1])out.add(bits[1].trim());else if(bits[0])out.add(bits[0].trim())})}if(/export\s+default\b/.test(text))out.add('default');return out;}
for(const src of srcRoots)for(const f of files(src)){const text=fs.readFileSync(f,'utf8');const re=/import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"]/g;for(const m of text.matchAll(re)){if(!m[2].startsWith('.')) continue; const target=resolveLocal(f,m[2]);if(!target){failures.push(`${path.relative(root,f)}: cannot resolve ${m[2]}`);continue;}const exp=exportsOf(fs.readFileSync(target,'utf8'));for(const raw of m[1].split(',')){const name=raw.trim().split(/\s+as\s+/)[0].trim();if(name&&!exp.has(name))failures.push(`${path.relative(root,f)} imports { ${name} } from ${path.relative(root,target)}, but it is not exported`);}}}
if(failures.length){console.error('Module contract check failed:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('✓ Local named import/export contracts passed');
