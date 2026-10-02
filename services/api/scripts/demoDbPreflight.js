const mongoose=require('mongoose');
const {validateTarget}=require('./demoDbGuard');
(async()=>{
 const {id,protectedState}=await validateTarget({destructive:false,requireClean:true});
 console.log('READ-ONLY TARGET CHECK PASSED. No database write was performed.');
 console.log('Write guard is enforced separately: seed/reset writes require an explicit demo/dev/test classification.');
 console.log(`Protected accounts: platform=${protectedState.platform.length}, agency=${protectedState.legacy.length}`);
 console.log(`Protected demo organizations: ${protectedState.orgs.map(x=>x.code).sort().join(', ')}`);
 console.log('CLEAN STATE: only the protected SuperAdmin + demo account/tenant set remains; business collections are empty. No write was performed.');
})().catch(e=>{console.error(`PREFLIGHT BLOCKED: ${e.message}`);process.exitCode=1}).finally(async()=>{try{await mongoose.connection.close()}catch{}});
