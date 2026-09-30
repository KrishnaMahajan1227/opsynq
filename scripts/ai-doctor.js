const path=require('path');const fs=require('fs');
const envPath=path.join(__dirname,'../services/api/.env');
if(fs.existsSync(envPath))require('dotenv').config({path:envPath});
const ai=require('../services/api/utils/aiAdvisor');
(async()=>{const r=await ai.health();console.log(`AI model: ${r.model||ai.MODEL()}`);console.log(`Configured: ${r.configured?'yes':'no'}`);console.log(`Live ready: ${r.ready&&r.verified?'yes':'no'}`);console.log(`Status: ${r.code||'UNKNOWN'}`);console.log(r.message||'');if(!r.configured||r.code==='INVALID_CREDENTIAL')process.exit(1);})().catch(e=>{console.error(e.message||e);process.exit(1)});
