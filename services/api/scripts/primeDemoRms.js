const mongoose=require('mongoose');
const {validateTarget}=require('./demoDbGuard');
const Organization=require('../models/platform/Organization');
const RmsDevice=require('../models/platform/RmsDevice');
const RmsTelemetry=require('../models/platform/RmsTelemetry');
const RmsCurrentState=require('../models/platform/RmsCurrentState');
const BeneficiaryContext=require('../models/platform/BeneficiaryContext');
const {ensureDemoDevices,runDemoCycle}=require('../utils/rmsEngine');

(async()=>{
 await validateTarget({write:true,requireClean:false});
 const companies=await Organization.find({type:'COMPANY',code:{$in:['SKEPL','AVSIL']},status:'ACTIVE'}).select('_id code').lean();
 if(!companies.length)throw new Error('No active demo companies found for RMS priming.');
 for(const company of companies){
  await ensureDemoDevices(company._id);
  await runDemoCycle(company._id);
  const devices=await RmsDevice.find({companyId:company._id,'metadata.simulated':true}).select('_id farmerId lifecycleStatus metadata').lean();
  const contextCount=await BeneficiaryContext.countDocuments({companyId:company._id});
  if(contextCount&&devices.filter(x=>x.farmerId).length<contextCount)throw new Error(`${company.code}: RMS demo coverage is incomplete (${devices.filter(x=>x.farmerId).length}/${contextCount} beneficiaries mapped).`);
  const active=devices.filter(x=>x.lifecycleStatus!=='DECOMMISSIONED');
  const farmerIds=active.map(x=>String(x.farmerId||'')).filter(Boolean);
  if(new Set(farmerIds).size!==farmerIds.length)throw new Error(`${company.code}: duplicate beneficiary RMS mappings detected during prime.`);
  for(const device of active){const count=await RmsTelemetry.countDocuments({deviceId:device._id});if(count<10)throw new Error(`${company.code}: RMS history is incomplete for device ${device._id} (${count} readings).`);const state=await RmsCurrentState.findOne({deviceId:device._id}).lean();if(!state)throw new Error(`${company.code}: RMS current state is missing for device ${device._id}.`);if(device.metadata?.scenario!=='COMMUNICATION_LOST'&&!(Number(state.energyTodayKwh||0)>0||Number(state.runtimeTodayMinutes||0)>0||Number(state.waterDischargeLitres||0)>0))throw new Error(`${company.code}: RMS device ${device._id} has zero-only demo telemetry.`);}
  const output=await RmsCurrentState.aggregate([{$match:{companyId:company._id}},{$group:{_id:null,activePumps:{$sum:{$cond:[{$and:[{$eq:['$pumpState','RUNNING']},{$eq:['$communication','ONLINE']}]},1,0]}},energy:{$sum:{$ifNull:['$energyTodayKwh',0]}},runtime:{$sum:{$ifNull:['$runtimeTodayMinutes',0]}},water:{$sum:{$ifNull:['$waterDischargeLitres',0]}}}}]).then(x=>x[0]||{});
  if(active.length&&!(Number(output.activePumps||0)>0&&Number(output.energy||0)>0&&Number(output.runtime||0)>0&&Number(output.water||0)>0))throw new Error(`${company.code}: demo RMS operating output is unexpectedly zero after prime.`);
  console.log(`✓ ${company.code} RMS primed: devices=${devices.length}, active=${active.length}, canonical-beneficiaries=${new Set(farmerIds).size}, running=${output.activePumps||0}, energy=${Number(output.energy||0).toFixed(1)} kWh`);
 }
 console.log('✓ Demo RMS prime completed.');
})().catch(e=>{console.error(`Demo RMS prime failed: ${e.message}`);process.exitCode=1}).finally(async()=>{try{await mongoose.connection.close()}catch{}});
