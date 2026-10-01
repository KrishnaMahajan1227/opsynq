const InstalledAsset=require('../models/platform/InstalledAsset');
const MaterialIssue=require('../models/platform/MaterialIssue');
const ServiceCase=require('../models/platform/ServiceCase');
const ComplianceRecord=require('../models/platform/ComplianceRecord');
const EvidenceSubmission=require('../models/platform/EvidenceSubmission');
const BeneficiaryMaterialReceipt=require('../models/platform/BeneficiaryMaterialReceipt');
const InsurancePolicy=require('../models/platform/InsurancePolicy');
const RmsTelemetry=require('../models/platform/RmsTelemetry');
const RmsAlert=require('../models/platform/RmsAlert');
const RmsDevice=require('../models/platform/RmsDevice');
const RmsCurrentState=require('../models/platform/RmsCurrentState');
const AssetLifecycleEvent=require('../models/platform/AssetLifecycleEvent');
const InventorySerial=require('../models/platform/InventorySerial');

async function beneficiaryDependencySummary(companyId,farmerIds){
 const ids=(farmerIds||[]).filter(Boolean); if(!ids.length)return {total:0,counts:{}};
 const q={companyId,farmerId:{$in:ids}};
 const defs=[
  ['installedAssets',InstalledAsset,q],['materialIssues',MaterialIssue,q],['serviceCases',ServiceCase,q],
  ['compliance',ComplianceRecord,q],['evidence',EvidenceSubmission,q],['materialReceipts',BeneficiaryMaterialReceipt,q],
  ['insurance',InsurancePolicy,q],['rmsTelemetry',RmsTelemetry,q],['rmsAlerts',RmsAlert,q],['rmsDevices',RmsDevice,q],
  ['rmsState',RmsCurrentState,q],['assetLifecycle',AssetLifecycleEvent,q],['inventorySerials',InventorySerial,q]
 ];
 const values=await Promise.all(defs.map(([,Model,filter])=>Model.countDocuments(filter)));
 const counts={};let total=0;defs.forEach(([key],i)=>{counts[key]=values[i];total+=values[i]});
 return {total,counts};
}

async function userDependencySummary(userId){
 const [issues,assets,receipts,alerts,cases]=await Promise.all([
  MaterialIssue.countDocuments({technicianUserId:userId}),InstalledAsset.countDocuments({technicianUserId:userId}),
  BeneficiaryMaterialReceipt.countDocuments({technicianUserId:userId}),RmsAlert.countDocuments({assignedTechnicianUserId:userId}),
  ServiceCase.countDocuments({assignedToLegacyUser:userId})
 ]);
 const counts={materialIssues:issues,installedAssets:assets,materialReceipts:receipts,rmsAlerts:alerts,serviceCases:cases};
 return {total:Object.values(counts).reduce((a,b)=>a+b,0),counts};
}

function dependencyMessage(summary,prefix='Record'){
 const labels={installedAssets:'installed assets',materialIssues:'material issues',serviceCases:'service cases',compliance:'compliance records',evidence:'evidence submissions',materialReceipts:'beneficiary material receipts',insurance:'insurance policies',rmsTelemetry:'RMS telemetry',rmsAlerts:'RMS alerts',rmsDevices:'RMS devices',rmsState:'RMS current states',assetLifecycle:'asset lifecycle events',inventorySerials:'inventory serials'};
 const parts=Object.entries(summary?.counts||{}).filter(([,n])=>n>0).map(([k,n])=>`${n} ${labels[k]||k}`);
 return `${prefix} has protected operational history${parts.length?`: ${parts.join(', ')}`:''}. Archive/close/deactivate it instead of hard deleting.`;
}
module.exports={beneficiaryDependencySummary,userDependencySummary,dependencyMessage};
