const mongoose=require('mongoose');
const {validateTarget}=require('./demoDbGuard');
(async()=>{const {id,protectedState}=await validateTarget({destructive:false});console.log(`SAFE TARGET: ${id.dbName} @ ${id.host}`);console.log(`Protected accounts: platform=${protectedState.platform.length}, agency=${protectedState.legacy.length}`);console.log(`Demo organizations found: ${protectedState.orgs.map(x=>x.code).sort().join(', ')}`);})().catch(e=>{console.error(`UNSAFE TARGET: ${e.message}`);process.exitCode=1}).finally(async()=>{try{await mongoose.connection.close()}catch{}});
