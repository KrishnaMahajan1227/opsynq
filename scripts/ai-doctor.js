const path=require('path');const fs=require('fs');
const envPath=path.join(__dirname,'../services/api/.env');
if(fs.existsSync(envPath))for(const raw of fs.readFileSync(envPath,'utf8').split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith('#'))continue;const i=line.indexOf('=');if(i<1)continue;const k=line.slice(0,i).trim();let v=line.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);if(process.env[k]===undefined)process.env[k]=v;}
const ai=require('../services/api/utils/aiAdvisor');
(async()=>{const r=await ai.health();console.log(`AI model: ${r.model||ai.MODEL()}`);console.log(`Configured: ${r.configured?'yes':'no'}`);console.log(`Live ready: ${r.ready&&r.verified?'yes':'no'}`);console.log(`Status: ${r.code||'UNKNOWN'}`);console.log(r.message||'');if(!r.configured||r.code==='INVALID_CREDENTIAL')process.exit(1);})().catch(e=>{console.error(e.message||e);process.exit(1)});
