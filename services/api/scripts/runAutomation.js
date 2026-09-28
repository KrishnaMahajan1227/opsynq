const path=require('path');
require('dotenv').config({path:path.resolve(__dirname,'../.env')});
const connectDB=require('../config/db');
const {runCycle}=require('../utils/automationEngine');
(async()=>{try{await connectDB();const runs=await runCycle('SYSTEM');for(const r of runs)console.log(`${r.job}: ${r.status}`,r.metrics||{},r.errors||[]);process.exit(runs.some(x=>x.status==='FAILED')?1:0)}catch(e){console.error('Automation run failed:',e);process.exit(1)}})();
