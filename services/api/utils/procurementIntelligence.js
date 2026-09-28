const ItemMaster=require('../models/platform/ItemMaster');
const Warehouse=require('../models/platform/Warehouse');
const InventoryBalance=require('../models/platform/InventoryBalance');
const StockMovement=require('../models/platform/StockMovement');
const PurchaseOrder=require('../models/platform/PurchaseOrder');
const ReplenishmentRecommendation=require('../models/platform/ReplenishmentRecommendation');
const Notification=require('../models/platform/Notification');
const AuditLog=require('../models/platform/AuditLog');

const ACTIVE_PO=['DRAFT','ISSUED','PARTIAL'];
const OUT_TYPES=['ISSUE','INSTALL','DISPATCH','TRANSFER'];
const round=(n,d=2)=>Number(Number(n||0).toFixed(d));
const recentNotification=async(companyId,entityId,title)=>Notification.exists({companyId,entityType:'ReplenishmentRecommendation',entityId,title,createdAt:{$gte:new Date(Date.now()-24*3600*1000)}});
async function notify(companyId,type,title,message,entityId){if(await recentNotification(companyId,entityId,title))return false;await Notification.create({companyId,type,title,message,entityType:'ReplenishmentRecommendation',entityId,actionUrl:'procurement-intelligence',recipientRoles:['company_owner','company_admin','inventory_manager','procurement_manager']});return true;}

async function latestCostForItem(companyId,itemId){
 const rows=await PurchaseOrder.find({companyId,'lines.itemId':itemId,status:{$ne:'CANCELLED'}}).sort({orderDate:-1,createdAt:-1}).limit(20).lean();
 for(const po of rows){const line=(po.lines||[]).find(x=>String(x.itemId)===String(itemId)&&Number(x.unitPrice)>0);if(line)return{supplierName:po.supplierName||'',unitPrice:Number(line.unitPrice||0),taxPercent:Number(line.taxPercent||0),currency:po.currency||'INR',leadDays:po.expectedDate&&po.orderDate?Math.max(1,Math.round((new Date(po.expectedDate)-new Date(po.orderDate))/86400000)):21};}
 return{supplierName:'',unitPrice:0,taxPercent:0,currency:'INR',leadDays:21};
}

async function openPoQty(companyId,warehouseId,itemId){
 const rows=await PurchaseOrder.find({companyId,warehouseId,status:{$in:ACTIVE_PO},'lines.itemId':itemId}).select('lines').lean();
 let qty=0;for(const po of rows)for(const line of po.lines||[])if(String(line.itemId)===String(itemId))qty+=Math.max(0,Number(line.orderedQty||0)-Number(line.receivedQty||0));return qty;
}

async function consumption(companyId,warehouseId,itemId,days=30){
 const since=new Date(Date.now()-days*86400000);const rows=await StockMovement.aggregate([{$match:{companyId,itemId,fromWarehouseId:warehouseId,movementType:{$in:OUT_TYPES},occurredAt:{$gte:since}}},{$group:{_id:null,qty:{$sum:'$quantity'}}}]);return Number(rows[0]?.qty||0);
}

async function createDraftPo(rec){
 if(rec.draftPurchaseOrderId)return PurchaseOrder.findById(rec.draftPurchaseOrderId);
 if(Number(rec.recommendedQty||0)<=0)return null;
 const item=await ItemMaster.findById(rec.itemId).lean();const warehouse=await Warehouse.findById(rec.warehouseId).lean();if(!item||!warehouse)return null;
 const source=rec.aiRationale?'AI_ASSISTED':'REPLENISHMENT_RULE';
 const po=await PurchaseOrder.create({companyId:rec.companyId,number:`AUTO-${Date.now().toString(36).toUpperCase()}-${String(item.sku||'ITEM').replace(/[^A-Z0-9]/gi,'').slice(0,8).toUpperCase()}`,supplierName:rec.suggestedSupplierName||'Supplier to confirm',warehouseId:rec.warehouseId,currency:rec.currency||'INR',source,recommendationId:rec._id,orderDate:new Date(),expectedDate:new Date(Date.now()+Number(rec.leadDays||21)*86400000),status:'DRAFT',lines:[{itemId:rec.itemId,description:item.name,orderedQty:Math.ceil(Number(rec.recommendedQty)),unitPrice:Number(rec.estimatedUnitCost||0),taxPercent:Number(rec.estimatedTaxPercent||0)}],notes:`Auto-prepared replenishment draft. Human review and issue approval required. ${rec.ruleRationale||''}`});
 rec.draftPurchaseOrderId=po._id;rec.status='DRAFT_PO_CREATED';await rec.save();
 await AuditLog.create({companyId:rec.companyId,organizationId:rec.companyId,actorType:'System',action:'REPLENISHMENT_DRAFT_PO_CREATED',entityType:'PurchaseOrder',entityId:po._id,after:{number:po.number,item:item.sku,quantity:rec.recommendedQty,source}});
 return po;
}

async function evaluateCompany(companyId,{autoDraft=true}={}){
 const balances=await InventoryBalance.find({companyId}).populate('itemId').populate('warehouseId').lean();let scanned=0,risks=0,drafts=0,notifications=0,resolved=0;const results=[];
 for(const b of balances){const item=b.itemId,warehouse=b.warehouseId;if(!item||!warehouse||item.isActive===false)continue;scanned++;
  const minStock=Number(item.minStock||0),reorderLevel=Number(item.reorderLevel||minStock||0);if(reorderLevel<=0&&minStock<=0)continue;
  const [usage30,poQty,cost]=await Promise.all([consumption(companyId,warehouse._id,item._id,30),openPoQty(companyId,warehouse._id,item._id),latestCostForItem(companyId,item._id)]);
  const avgDaily=usage30/30,onHand=Number(b.onHand||0),inTransit=Number(b.inTransit||0),projected=onHand+inTransit+poQty,daysCover=avgDaily>0?onHand/avgDaily:null;
  const target=Math.max(reorderLevel*2,Math.ceil(avgDaily*Math.max(14,cost.leadDays||21)),minStock);const recommended=Math.max(0,Math.ceil(target-projected));
  let severity=null;if(onHand<=0&&projected<=0)severity='OUT_OF_STOCK';else if(projected<=minStock||(daysCover!==null&&daysCover<=7))severity='CRITICAL';else if(projected<=reorderLevel||(daysCover!==null&&daysCover<=14))severity='WARNING';
  const existing=await ReplenishmentRecommendation.findOne({companyId,warehouseId:warehouse._id,itemId:item._id});
  if(!severity||recommended<=0){if(existing&&!['ORDERED','DISMISSED','RESOLVED'].includes(existing.status)){existing.status='RESOLVED';existing.lastEvaluatedAt=new Date();await existing.save();resolved++;}continue;}
  risks++;const estimatedOrderValue=round(recommended*cost.unitPrice*(1+cost.taxPercent/100));
  const ruleRationale=`${item.sku} has ${round(onHand,0)} on hand, ${round(inTransit,0)} in transit and ${round(poQty,0)} still open on purchase orders. Reorder trigger is ${reorderLevel}; suggested target stock is ${target}.`;
  const rec=await ReplenishmentRecommendation.findOneAndUpdate({companyId,warehouseId:warehouse._id,itemId:item._id},{$set:{severity,currentOnHand:onHand,inTransit,openPoQty:poQty,minStock,reorderLevel,avgDailyConsumption:round(avgDaily,3),daysCover:daysCover===null?null:round(daysCover,1),recommendedQty:recommended,targetStock:target,leadDays:cost.leadDays||21,suggestedSupplierName:cost.supplierName,estimatedUnitCost:cost.unitPrice,estimatedTaxPercent:cost.taxPercent,estimatedOrderValue,currency:cost.currency||'INR',ruleRationale,lastEvaluatedAt:new Date(),...(existing?.status==='DISMISSED'?{}:{status:existing?.draftPurchaseOrderId?'DRAFT_PO_CREATED':'OPEN'})}},{$setOnInsert:{companyId,warehouseId:warehouse._id,itemId:item._id}},{upsert:true,new:true,setDefaultsOnInsert:true});
  const title=`${severity==='OUT_OF_STOCK'?'Out of stock':severity==='CRITICAL'?'Critical stock risk':'Replenishment recommended'} · ${item.sku}`;notifications+=await notify(companyId,severity==='WARNING'?'WARNING':'CRITICAL',title,`${item.name} at ${warehouse.name}: ${Math.ceil(recommended)} units recommended for review.`,rec._id)?1:0;
  if(autoDraft&&process.env.PROCUREMENT_AUTO_DRAFT!=='false'&&!rec.draftPurchaseOrderId){const po=await createDraftPo(rec);if(po)drafts++;}
  results.push({recommendation:rec,item:{_id:item._id,sku:item.sku,name:item.name},warehouse:{_id:warehouse._id,code:warehouse.code,name:warehouse.name}});
 }
 return{scanned,risks,drafts,notifications,resolved,results};
}

module.exports={evaluateCompany,createDraftPo};
