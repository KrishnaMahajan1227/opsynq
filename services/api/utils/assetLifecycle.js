const BeneficiaryContext=require('../models/platform/BeneficiaryContext');
const InventorySerial=require('../models/platform/InventorySerial');
const InstalledAsset=require('../models/platform/InstalledAsset');
const AssetLifecycleEvent=require('../models/platform/AssetLifecycleEvent');
const MaterialIssue=require('../models/platform/MaterialIssue');
const StockMovement=require('../models/platform/StockMovement');

const roleFor=(item={})=>{if(item.installationRole&&item.installationRole!=='NONE')return item.installationRole;const s=`${item.category||''} ${item.name||''} ${item.sku||''}`.toLowerCase();if(s.includes('pump'))return'PUMP';if(s.includes('motor'))return'MOTOR';if(s.includes('controller')||s.includes('inverter'))return'CONTROLLER';if(s.includes('panel')||s.includes('module'))return'PANEL';return'OTHER'};
const err=(message,status=409)=>{const e=new Error(message);e.statusCode=status;return e};

async function getContext(farmerId){return BeneficiaryContext.findOne({farmerId}).lean();}

async function getIssuedInventory({farmerId,technicianUserId}){
 const context=await getContext(farmerId);if(!context)return{linked:false,context:null,serials:[]};
 const issueQuery={companyId:context.companyId,agencyId:context.agencyId,technicianUserId,status:{$in:['ISSUED','PARTIALLY_RETURNED']},$or:[{farmerId},{farmerId:null,workPackageId:context.workPackageId}]};
 const issues=await MaterialIssue.find(issueQuery).select('items issueNo farmerId workPackageId').lean();
 const ids=[...new Set(issues.flatMap(i=>i.items.flatMap(x=>(x.serialIds||[]).map(String))))];
 const serials=ids.length?await InventorySerial.find({_id:{$in:ids},companyId:context.companyId,status:'ISSUED'}).populate('itemId','sku name category brand model warrantyMonths installationRole').lean():[];
 return{linked:true,context,issues,serials};
}

async function prepareInstallation({farmerId,technicianUserId,pump,motor,controller,panels=[]}){
 const inv=await getIssuedInventory({farmerId,technicianUserId});if(!inv.linked)return{linked:false};
 const submitted=[['PUMP',pump],['MOTOR',motor],['CONTROLLER',controller],...panels.map(x=>['PANEL',x])].filter(x=>String(x[1]||'').trim());
 const values=submitted.map(x=>String(x[1]).trim());
 if(new Set(values.map(v=>v.toLowerCase())).size!==values.length)throw err('The same serial/barcode cannot be used more than once in an installation.',400);
 const docs=await InventorySerial.find({companyId:inv.context.companyId,status:'ISSUED',$or:[{serialNumber:{$in:values}},{barcodeValue:{$in:values}}]}).populate('itemId','sku name category brand model warrantyMonths installationRole');
 const byCode=new Map();for(const d of docs){byCode.set(String(d.serialNumber).toLowerCase(),d);if(d.barcodeValue)byCode.set(String(d.barcodeValue).toLowerCase(),d)}
 const resolved=[];
 for(const [expectedRole,code] of submitted){const d=byCode.get(String(code).toLowerCase());if(!d)throw err(`Serial/barcode ${code} is not available in the technician's issued inventory.`);const owner=String(d.metadata?.technicianUserId||'');if(owner&&owner!==String(technicianUserId))throw err(`Serial/barcode ${code} is issued to another technician.`);if(d.agencyId&&String(d.agencyId)!==String(inv.context.agencyId))throw err(`Serial/barcode ${code} belongs to another agency.`);const actualRole=roleFor(d.itemId);if(actualRole!=='OTHER'&&expectedRole!==actualRole)throw err(`${code} is registered as ${actualRole.toLowerCase()} material, not ${expectedRole.toLowerCase()}.`,400);resolved.push({expectedRole,doc:d});}
 const alreadyInstalled=await InstalledAsset.findOne({companyId:inv.context.companyId,inventorySerialId:{$in:resolved.map(x=>x.doc._id)}}).lean();
 if(alreadyInstalled)throw err(`Serial ${alreadyInstalled.serialNumber} is already linked to an installed asset.`);
 return{linked:true,context:inv.context,resolved,canonical:{pump:resolved.find(x=>x.expectedRole==='PUMP')?.doc.serialNumber||pump,motor:resolved.find(x=>x.expectedRole==='MOTOR')?.doc.serialNumber||motor,controller:resolved.find(x=>x.expectedRole==='CONTROLLER')?.doc.serialNumber||controller,panels:resolved.filter(x=>x.expectedRole==='PANEL').map(x=>x.doc.serialNumber)}};
}

async function finalizeInstallation({prepared,farmerId,technicianUserId}){
 if(!prepared?.linked)return[];const now=new Date(),created=[];
 for(const r of prepared.resolved){const d=r.doc;const existing=await InstalledAsset.findOne({companyId:prepared.context.companyId,inventorySerialId:d._id});if(existing)throw err(`Serial ${d.serialNumber} is already linked to an installed asset.`);
  d.status='INSTALLED';d.farmerId=farmerId;d.installedAt=now;d.warehouseId=null;d.metadata={...(d.metadata||{}),installedByTechnicianUserId:String(technicianUserId),workPackageId:String(prepared.context.workPackageId)};await d.save();
  const months=Number(d.itemId?.warrantyMonths||0);const warrantyEnd=months?new Date(new Date(now).setMonth(now.getMonth()+months)):null;
  const asset=await InstalledAsset.create({companyId:prepared.context.companyId,agencyId:prepared.context.agencyId,farmerId,workPackageId:prepared.context.workPackageId,technicianUserId,itemId:d.itemId._id,inventorySerialId:d._id,serialNumber:d.serialNumber,barcodeValue:d.barcodeValue,assetRole:r.expectedRole,status:'ACTIVE',installedAt:now,warrantyStart:now,warrantyEnd,metadata:{sourceScanAttributes:d.metadata?.scanAttributes||{},agencyReceiptAttributes:d.metadata?.agencyReceiptAttributes||{},sourceReceiptNo:d.metadata?.receiptNo||''}});
  await AssetLifecycleEvent.create({companyId:prepared.context.companyId,agencyId:prepared.context.agencyId,farmerId,installedAssetId:asset._id,inventorySerialId:d._id,eventType:'INSTALLED',performedByLegacyUser:technicianUserId,occurredAt:now});
  await StockMovement.create({companyId:prepared.context.companyId,itemId:d.itemId._id,serialIds:[d._id],quantity:1,movementType:'INSTALL',fromOrganizationId:prepared.context.agencyId,toOrganizationId:prepared.context.agencyId,referenceType:'Farmer',referenceId:farmerId,reason:'Installed at beneficiary site',performedBy:technicianUserId,occurredAt:now});
  created.push(asset);
 }
 // Reconcile technician issue documents after serial custody leaves ISSUED state.
 const issues=await MaterialIssue.find({companyId:prepared.context.companyId,technicianUserId,'items.serialIds':{$in:prepared.resolved.map(x=>x.doc._id)},status:{$in:['ISSUED','PARTIALLY_RETURNED']}});
 for(const issue of issues){const ids=issue.items.flatMap(x=>(x.serialIds||[]));if(!ids.length)continue;const remaining=await InventorySerial.countDocuments({_id:{$in:ids},status:'ISSUED'});if(remaining===0){const returned=await InventorySerial.countDocuments({_id:{$in:ids},status:'RETURNED'});issue.status=returned?'PARTIALLY_RETURNED':'CONSUMED';await issue.save();}}
 return created;
}
module.exports={getIssuedInventory,prepareInstallation,finalizeInstallation,roleFor};
