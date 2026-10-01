const mongoose=require('mongoose');
const BeneficiaryContext=require('../models/platform/BeneficiaryContext');
const BeneficiaryMaterialReceipt=require('../models/platform/BeneficiaryMaterialReceipt');
const InventorySerial=require('../models/platform/InventorySerial');
const MaterialIssue=require('../models/platform/MaterialIssue');
const StockMovement=require('../models/platform/StockMovement');
const {getIssuedInventory,roleFor}=require('./assetLifecycle');

const norm=v=>String(v||'').trim();
const lower=v=>norm(v).toLowerCase();
const unique=list=>[...new Set((list||[]).map(norm).filter(Boolean))];
const fail=(message,statusCode=409,code='MATERIAL_RECEIPT_ERROR',extra={})=>Object.assign(new Error(message),{statusCode,code,...extra});

async function latestReceipt({farmerId,companyId=null}){
 const q={farmerId,status:{$in:['CONFIRMED','PARTIAL','EXCEPTION']}};if(companyId)q.companyId=companyId;
 return BeneficiaryMaterialReceipt.findOne(q).populate('technicianUserId','username mobile').populate('items.itemId','sku name category installationRole').sort({revision:-1,createdAt:-1}).lean();
}

async function confirmReceipt({farmerId,technicianUserId,receivedCodes=[],damagedCodes=[],remarks='',fullSetOrPartialSet='',lrPhotoUrls=[],farmerSignatureUrl='',technicianSignatureUrl='',session=null}){
 const inv=await getIssuedInventory({farmerId,technicianUserId});
 if(!inv.linked)throw fail('This beneficiary is not linked to governed company inventory.',409,'MATERIAL_INVENTORY_NOT_LINKED');
 const received=unique(receivedCodes),damaged=unique(damagedCodes);
 if(new Set([...received,...damaged].map(lower)).size!==received.length+damaged.length)throw fail('The same serial/barcode cannot be marked more than once in a receipt.',400,'DUPLICATE_RECEIPT_SERIAL');
 const available=new Map();for(const s of inv.serials||[]){available.set(lower(s.serialNumber),s);if(s.barcodeValue)available.set(lower(s.barcodeValue),s)}
 const selected=[];
 for(const [condition,codes] of [['GOOD',received],['DAMAGED',damaged]])for(const code of codes){const s=available.get(lower(code));if(!s)throw fail(`${code} is not issued to this technician for this beneficiary/work package.`,409,'RECEIPT_SERIAL_NOT_ISSUED');selected.push({condition,serial:s});}
 const direct=(inv.serials||[]).filter(s=>s.assignmentScope==='BENEFICIARY');
 const selectedIds=new Set(selected.map(x=>String(x.serial._id)));
 const missing=direct.filter(s=>!selectedIds.has(String(s._id)));
 if(String(fullSetOrPartialSet||'').toLowerCase()==='full set'&&(missing.length||damaged.length))throw fail('Full Set cannot be confirmed while issued material is missing or damaged. Select Partial Set and record the exception, or reconcile the material first.',409,'FULL_SET_RECONCILIATION_FAILED',{missing:missing.map(x=>x.serialNumber),damaged});
 if((missing.length||damaged.length)&&!norm(remarks))throw fail('Shortage / damaged remarks are required when receipt has exceptions.',400,'RECEIPT_EXCEPTION_REMARK_REQUIRED');
 if(!selected.length&&direct.length)throw fail('Scan the material physically received before confirming receipt.',400,'RECEIPT_SCAN_REQUIRED');
 if(!selected.length&&!direct.length)throw fail('No serialized material has been selected for this beneficiary. Scan the issued items before confirming receipt.',400,'RECEIPT_SCAN_REQUIRED');
 const context=inv.context;
 const previous=await BeneficiaryMaterialReceipt.findOne({companyId:context.companyId,farmerId,status:{$in:['CONFIRMED','PARTIAL','EXCEPTION']}}).sort({revision:-1});
 const revision=Number(previous?.revision||0)+1,receiptNo=`BMR-${String(farmerId).slice(-6).toUpperCase()}-${revision}`;
 const issueIds=[...new Set((inv.issues||[]).filter(issue=>(issue.items||[]).some(line=>(line.serialIds||[]).some(id=>selectedIds.has(String(id))||missing.some(m=>String(m._id)===String(id))))).map(x=>String(x._id)))];
 const now=new Date(),items=[];
 for(const x of selected){const s=x.serial,role=roleFor(s.itemId);items.push({inventorySerialId:s._id,itemId:s.itemId?._id||s.itemId,role,serialNumber:s.serialNumber,barcodeValue:s.barcodeValue||'',assignmentScope:s.assignmentScope||'WORK_PACKAGE',condition:x.condition,scannedAt:now});}
 for(const s of missing){items.push({inventorySerialId:s._id,itemId:s.itemId?._id||s.itemId,role:roleFor(s.itemId),serialNumber:s.serialNumber,barcodeValue:s.barcodeValue||'',assignmentScope:'BENEFICIARY',condition:'MISSING',scannedAt:null});}
 const hasException=items.some(x=>x.condition!=='GOOD');
 const doc=new BeneficiaryMaterialReceipt({companyId:context.companyId,agencyId:context.agencyId,farmerId,workPackageId:context.workPackageId||null,technicianUserId,receiptNo,revision,status:hasException?(received.length?'PARTIAL':'EXCEPTION'):'CONFIRMED',issueIds,items,remarks:norm(remarks),lrPhotoUrls:(lrPhotoUrls||[]).filter(Boolean),farmerSignatureUrl:norm(farmerSignatureUrl),technicianSignatureUrl:norm(technicianSignatureUrl),receivedAt:now,confirmedAt:now});
 if(session)await doc.save({session});else await doc.save();
 if(previous){previous.status='SUPERSEDED';if(session)await previous.save({session});else await previous.save();}
 for(const x of selected){const s=await InventorySerial.findOne({_id:x.serial._id,companyId:context.companyId}).session(session||null);if(!s)continue;s.farmerId=farmerId;s.agencyId=context.agencyId;s.metadata={...(s.metadata||{}),technicianUserId:String(technicianUserId),beneficiaryReceiptId:String(doc._id),beneficiaryReceiptNo:receiptNo,beneficiaryReceivedAt:now,beneficiaryReceiptCondition:x.condition};if(x.condition==='DAMAGED'){s.status='DAMAGED';s.warehouseId=null;}else{s.status='ISSUED';}await s.save(session?{session}:undefined);}
 for(const s0 of missing){const s=await InventorySerial.findOne({_id:s0._id,companyId:context.companyId}).session(session||null);if(!s)continue;s.farmerId=farmerId;s.status='MISSING';s.warehouseId=null;s.metadata={...(s.metadata||{}),beneficiaryReceiptId:String(doc._id),beneficiaryReceiptNo:receiptNo,beneficiaryReceiptCondition:'MISSING',beneficiaryReceivedAt:now};await s.save(session?{session}:undefined);}
 const movementDocs=[];for(const x of selected){movementDocs.push({companyId:context.companyId,itemId:x.serial.itemId?._id||x.serial.itemId,serialIds:[x.serial._id],quantity:1,movementType:x.condition==='DAMAGED'?'DAMAGE':'TRANSFER',fromOrganizationId:context.agencyId,toOrganizationId:context.agencyId,referenceType:'BeneficiaryMaterialReceipt',referenceId:doc._id,reason:x.condition==='DAMAGED'?'Damaged at technician beneficiary receipt':'Technician confirmed beneficiary receipt',performedBy:technicianUserId,occurredAt:now});}for(const s of missing)movementDocs.push({companyId:context.companyId,itemId:s.itemId?._id||s.itemId,serialIds:[s._id],quantity:1,movementType:'ADJUSTMENT',fromOrganizationId:context.agencyId,toOrganizationId:context.agencyId,referenceType:'BeneficiaryMaterialReceipt',referenceId:doc._id,reason:'Missing at technician beneficiary receipt',performedBy:technicianUserId,occurredAt:now});if(movementDocs.length){if(session)await StockMovement.insertMany(movementDocs,{session});else await StockMovement.insertMany(movementDocs);}
 return doc.toObject();
}

async function compareInstallationToReceipt({farmerId,companyId,codes=[]}){
 const receipt=await latestReceipt({farmerId,companyId});if(!receipt)return{required:true,receipt:null,ok:false,code:'MATERIAL_RECEIPT_REQUIRED',message:'Confirm beneficiary material receipt before installation.'};
 const expected=(receipt.items||[]).filter(x=>x.condition==='GOOD').map(x=>norm(x.serialNumber));
 const submitted=unique(codes);const exp=new Map(expected.map(x=>[lower(x),x])),sub=new Map(submitted.map(x=>[lower(x),x]));
 const missing=[...exp].filter(([k])=>!sub.has(k)).map(([,v])=>v),unexpected=[...sub].filter(([k])=>!exp.has(k)).map(([,v])=>v);
 const exceptions=(receipt.items||[]).filter(x=>x.condition!=='GOOD').map(x=>({serialNumber:x.serialNumber,condition:x.condition,role:x.role}));
 const ok=!missing.length&&!unexpected.length&&!exceptions.length;
 return{required:true,receipt,ok,missing,unexpected,exceptions,code:ok?'MATCHED':'INSTALLATION_MATERIAL_MISMATCH',message:ok?'Installation scan matches the confirmed beneficiary receipt.':`Installation material does not match the confirmed receipt${missing.length?`; missing: ${missing.join(', ')}`:''}${unexpected.length?`; unexpected: ${unexpected.join(', ')}`:''}${exceptions.length?`; receipt exceptions: ${exceptions.map(x=>`${x.serialNumber} ${x.condition}`).join(', ')}`:''}.`};
}

module.exports={latestReceipt,confirmReceipt,compareInstallationToReceipt};
