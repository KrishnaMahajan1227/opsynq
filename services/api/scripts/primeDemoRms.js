const mongoose=require('mongoose');
const {validateTarget}=require('./demoDbGuard');
const Organization=require('../models/platform/Organization');
const RmsDevice=require('../models/platform/RmsDevice');
const RmsTelemetry=require('../models/platform/RmsTelemetry');
const {ensureDemoDevices,runDemoCycle}=require('../utils/rmsEngine');

(async()=>{
 await validateTarget({write:true,requireClean:false});
 const companies=await Organization.find({type:'COMPANY',code:{$in:['SKEPL','AVSIL']},status:'ACTIVE'}).select('_id code').lean();
 if(!companies.length)throw new Error('No active demo companies found for RMS priming.');
 for(const company of companies){
  await ensureDemoDevices(company._id);
  await runDemoCycle(company._id);
  const devices=await RmsDevice.find({companyId:company._id,'metadata.simulated':true}).select('_id farmerId lifecycleStatus').lean();
  const active=devices.filter(x=>x.lifecycleStatus!=='DECOMMISSIONED');
  const farmerIds=active.map(x=>String(x.farmerId||'')).filter(Boolean);
  if(new Set(farmerIds).size!==farmerIds.length)throw new Error(`${company.code}: duplicate beneficiary RMS mappings detected during prime.`);
  for(const device of active){const count=await RmsTelemetry.countDocuments({deviceId:device._id});if(count<10)throw new Error(`${company.code}: RMS history is incomplete for device ${device._id} (${count} readings).`);}
  console.log(`✓ ${company.code} RMS primed: devices=${devices.length}, active=${active.length}, canonical-beneficiaries=${new Set(farmerIds).size}`);
 }
 console.log('✓ Demo RMS prime completed.');
})().catch(e=>{console.error(`Demo RMS prime failed: ${e.message}`);process.exitCode=1}).finally(async()=>{try{await mongoose.connection.close()}catch{}});
