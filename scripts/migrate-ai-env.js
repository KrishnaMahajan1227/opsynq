const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const platformPath=path.join(root,'apps/platform-web/.env');
const apiPath=path.join(root,'services/api/.env');
const keys=['AI_PROVIDER_API_KEY','GEMINI_API_KEY','AI_MODEL'];

function readLines(file){return fs.existsSync(file)?fs.readFileSync(file,'utf8').split(/\r?\n/):[]}
function valueMap(lines){const out={};for(const line of lines){if(!line||/^\s*#/.test(line)||!line.includes('='))continue;const i=line.indexOf('=');out[line.slice(0,i).trim()]=line.slice(i+1)}return out}
function setValue(lines,key,value){let found=false;const out=lines.map(line=>{if(line.startsWith(`${key}=`)){found=true;return `${key}=${value}`}return line});if(!found)out.push(`${key}=${value}`);return out}
function writeAtomic(file,lines){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=`${file}.tmp-${process.pid}`;fs.writeFileSync(tmp,lines.join('\n').replace(/\n+$/,'')+'\n');fs.renameSync(tmp,file)}

const platformLines=readLines(platformPath),apiLinesInitial=readLines(apiPath);
const platform=valueMap(platformLines),api=valueMap(apiLinesInitial);
const selected={};
for(const key of keys) selected[key]=api[key]||platform[key]||'';
if(!selected.GEMINI_API_KEY&&!selected.AI_PROVIDER_API_KEY){console.error('No server-side AI credential found. Add GEMINI_API_KEY to services/api/.env.');process.exit(1)}
let apiLines=apiLinesInitial;
for(const key of keys)if(selected[key])apiLines=setValue(apiLines,key,selected[key]);
const cleanedPlatform=platformLines.filter(line=>!keys.some(key=>line.startsWith(`${key}=`)));
writeAtomic(apiPath,apiLines);writeAtomic(platformPath,cleanedPlatform);
console.log('✓ AI credential/model configuration is server-side in services/api/.env');
console.log('✓ Frontend .env no longer contains server AI secrets');
