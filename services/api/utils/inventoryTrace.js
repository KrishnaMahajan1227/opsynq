const InventorySerial=require('../models/platform/InventorySerial');
const StockMovement=require('../models/platform/StockMovement');
const Shipment=require('../models/platform/Shipment');
const MaterialIssue=require('../models/platform/MaterialIssue');
const InstalledAsset=require('../models/platform/InstalledAsset');
const BeneficiaryContext=require('../models/platform/BeneficiaryContext');

const text=v=>String(v??'').trim();
const cleanKey=k=>text(k).replace(/[^a-zA-Z0-9_.-]/g,'_').slice(0,80);
const sanitizeValue=(v,depth=0)=>{
 if(v===null||v===undefined)return v;
 if(['string','number','boolean'].includes(typeof v))return typeof v==='string'?v.slice(0,500):v;
 if(depth>=2)return text(v).slice(0,500);
 if(Array.isArray(v))return v.slice(0,30).map(x=>sanitizeValue(x,depth+1));
 if(typeof v==='object')return sanitizeAttributes(v,depth+1);
 return text(v).slice(0,500);
};
function sanitizeAttributes(input,depth=0){
 if(!input||typeof input!=='object'||Array.isArray(input))return{};
 const out={};let count=0;
 for(const[k,v]of Object.entries(input)){
  if(count>=40)break;
  const key=cleanKey(k);if(!key||['_id','companyId','agencyId','farmerId','warehouseId','itemId','status'].includes(key))continue;
  out[key]=sanitizeValue(v,depth);count++;
 }
 return out;
}
function parseGs1(value){
 const out={};let code='';
 const human=value.match(/^\((\d{2,4})\)/)?value:'';
 if(human){
  const rx=/\((\d{2,4})\)([^()]*)/g;let m;
  while((m=rx.exec(value))){const ai=m[1],v=text(m[2]);if(!v)continue;if(ai==='01')out.gtin=v;else if(ai==='10')out.batchNo=v;else if(ai==='17')out.expiryYYMMDD=v;else if(ai==='21'){out.serialNumber=v;code=v}else out[`gs1_${ai}`]=v;}
  return{code:code||out.gtin||value,attributes:out};
 }
 const compact=value.replace(/^\]C1/,'');
 if(/^01\d{14}/.test(compact)){
  out.gtin=compact.slice(2,16);let rest=compact.slice(16),m=rest.match(/(?:^|\x1d)21([^\x1d]+)/);if(m){out.serialNumber=m[1];code=m[1]}m=rest.match(/(?:^|\x1d)10([^\x1d]+)/);if(m)out.batchNo=m[1];m=rest.match(/(?:^|\x1d)17(\d{6})/);if(m)out.expiryYYMMDD=m[1];return{code:code||out.gtin,attributes:out};
 }
 return null;
}
function parseScanPayload(raw){
 if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
  const candidate=text(raw.serialNumber||raw.barcodeValue||raw.serial||raw.barcode||raw.code||raw.value||raw.gtin||raw.GTIN),nested=candidate?parseScanPayload(candidate):{code:'',attributes:{}};
  const identity={};if(raw.serialNumber||raw.serial)identity.serialNumber=text(raw.serialNumber||raw.serial);if(raw.barcodeValue||raw.barcode)identity.barcodeValue=text(raw.barcodeValue||raw.barcode);
  const attributes=sanitizeAttributes({...nested.attributes,...identity,...Object.fromEntries(Object.entries(raw).filter(([k])=>!['serialNumber','barcodeValue','serial','barcode','code','value'].includes(k)))});
  return{code:nested.code||candidate,attributes};
 }
 const value=text(raw);if(!value)return{code:'',attributes:{}};
 if(value.startsWith('{')){try{return parseScanPayload(JSON.parse(value))}catch{}}
 try{const u=new URL(value);const params=Object.fromEntries(u.searchParams.entries());if(Object.keys(params).length){const parsed=parseScanPayload(params);if(parsed.code)return parsed;}}catch{}
 const gs1=parseGs1(value);if(gs1)return{code:gs1.code,attributes:sanitizeAttributes(gs1.attributes)};
 const parts=value.split(/[|;]/).map(x=>x.trim()).filter(Boolean);if(parts.length>1){const attributes={};for(const part of parts.slice(1)){const i=part.indexOf('=');if(i>0)attributes[cleanKey(part.slice(0,i))]=sanitizeValue(part.slice(i+1))}return{code:parts[0],attributes:sanitizeAttributes(attributes)}}
 return{code:value,attributes:{}};
}

async function materialReconciliation({companyId,farmerId,agencyId}){
 const ctx=await BeneficiaryContext.findOne({companyId,farmerId}).populate('agencyId','name code').populate('workPackageId','code name').lean();
 if(!ctx)return null;if(agencyId&&String(ctx.agencyId?._id||ctx.agencyId)!==String(agencyId))return null;
 const issues=await MaterialIssue.find({companyId,farmerId}).populate('items.itemId','sku name category installationRole').populate('items.serialIds','serialNumber barcodeValue status metadata').populate('technicianUserId','username mobile').sort({issuedAt:-1}).lean();
 const assets=await InstalledAsset.find({companyId,farmerId}).populate('itemId','sku name category installationRole').populate('inventorySerialId','serialNumber barcodeValue status metadata').sort({installedAt:-1}).lean();
 const rows=new Map();
 const ensure=item=>{const id=String(item?._id||item||'unknown');if(!rows.has(id))rows.set(id,{itemId:id,sku:item?.sku||'',name:item?.name||'Unknown item',role:item?.installationRole||'OTHER',issued:0,installed:0,remaining:0,returned:0,damaged:0,missing:0,serials:[]});return rows.get(id)};
 for(const issue of issues)for(const line of issue.items||[]){const row=ensure(line.itemId);row.issued+=Number(line.quantity||0);for(const s of line.serialIds||[]){const status=String(s.status||'');row.serials.push({serialNumber:s.serialNumber,barcodeValue:s.barcodeValue,status});if(status==='ISSUED'||status==='AGENCY_STOCK'||status==='AVAILABLE'||status==='IN_TRANSIT')row.remaining++;else if(status==='RETURNED')row.returned++;else if(status==='DAMAGED'||status==='REJECTED')row.damaged++;else if(status==='MISSING')row.missing++;}}
 for(const asset of assets){const row=ensure(asset.itemId);if(asset.status==='ACTIVE'||asset.status==='REPLACED'||asset.status==='REMOVED'||asset.status==='RETURNED'||asset.status==='DAMAGED')row.installed++;}
 for(const row of rows.values()){if(!row.serials.length)row.remaining=Math.max(0,row.issued-row.installed-row.returned-row.damaged-row.missing);row.mismatch=Math.max(0,row.issued-(row.installed+row.remaining+row.returned+row.damaged+row.missing));}
 const totals=[...rows.values()].reduce((a,r)=>({issued:a.issued+r.issued,installed:a.installed+r.installed,remaining:a.remaining+r.remaining,returned:a.returned+r.returned,damaged:a.damaged+r.damaged,missing:a.missing+r.missing,mismatch:a.mismatch+r.mismatch}),{issued:0,installed:0,remaining:0,returned:0,damaged:0,missing:0,mismatch:0});
 return{context:{agency:ctx.agencyId||null,workPackage:ctx.workPackageId||null},totals,items:[...rows.values()],issues,assets};
}
async function traceSerial({companyId,code}){
 const serial=await InventorySerial.findOne({companyId,$or:[{serialNumber:code},{barcodeValue:code}]}).populate('itemId','sku name category brand manufacturer model installationRole warrantyMonths').populate('warehouseId','code name type').populate('agencyId','code name').populate('farmerId','beneficiaryId beneficiaryName village taluka district').lean();
 if(!serial)return null;
 const [movements,shipments,issues,asset]=await Promise.all([
  StockMovement.find({companyId,serialIds:serial._id}).populate('fromWarehouseId','code name').populate('toWarehouseId','code name').populate('fromOrganizationId','code name type').populate('toOrganizationId','code name type').sort({occurredAt:1}).lean(),
  Shipment.find({companyId,'items.serialIds':serial._id}).populate('agencyId','code name').populate('workPackageId','code name').populate('fromWarehouseId','code name').populate('toWarehouseId','code name').sort({createdAt:1}).lean(),
  MaterialIssue.find({companyId,'items.serialIds':serial._id}).populate('agencyId','code name').populate('technicianUserId','username mobile').populate('workPackageId','code name').populate('farmerId','beneficiaryId beneficiaryName').sort({issuedAt:1}).lean(),
  InstalledAsset.findOne({companyId,inventorySerialId:serial._id}).populate('agencyId','code name').populate('farmerId','beneficiaryId beneficiaryName village district').populate('technicianUserId','username mobile').lean()
 ]);
 return{serial,movements,shipments,issues,asset,current:{status:serial.status,warehouse:serial.warehouseId||null,agency:serial.agencyId||asset?.agencyId||null,beneficiary:serial.farmerId||asset?.farmerId||null}};
}
module.exports={sanitizeAttributes,parseScanPayload,materialReconciliation,traceSerial};
