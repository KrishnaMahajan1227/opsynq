const mongoose=require('mongoose');
const Organization=require('../../models/platform/Organization');
const Program=require('../../models/platform/Program');
const Contract=require('../../models/platform/Contract');
const WorkOrder=require('../../models/platform/WorkOrder');
const WorkPackage=require('../../models/platform/WorkPackage');
const BeneficiaryContext=require('../../models/platform/BeneficiaryContext');
const PurchaseOrder=require('../../models/platform/PurchaseOrder');
const InventoryBalance=require('../../models/platform/InventoryBalance');
const Shipment=require('../../models/platform/Shipment');
const Driver=require('../../models/platform/Driver');
const Vehicle=require('../../models/platform/Vehicle');
const ServiceCase=require('../../models/platform/ServiceCase');
const CommercialClaim=require('../../models/platform/CommercialClaim');
const Notification=require('../../models/platform/Notification');
const platformAudit=require('../../utils/platformAudit');
const ai=require('../../utils/aiAdvisor');
const automationEngine=require('../../utils/automationEngine');

const companyIdFor=req=>req.platformUser.role==='platform_superadmin'?(req.query.companyId||req.body.companyId):String(req.tenant.companyId||'');
async function ensureCompany(req,res){const id=companyIdFor(req);if(!id){res.status(400).json({message:'Company context is required.'});return null;}const c=await Organization.findOne({_id:id,type:'COMPANY',status:{$ne:'ARCHIVED'}}).select('name code status').lean();if(!c){res.status(404).json({message:'Company not found.'});return null;}return c;}
const groupToObject=rows=>Object.fromEntries((rows||[]).map(x=>[String(x._id||'UNKNOWN'),Number(x.count||0)]));
async function buildFacts(companyId){
 const cid=new mongoose.Types.ObjectId(String(companyId));
 const [programs,contracts,workOrders,wpStatus,beneficiaryStatus,poStatus,stock,shipmentStatus,overdueShipments,drivers,vehicles,serviceStatus,claimStatus,unread]=await Promise.all([
  Program.countDocuments({companyId:cid,status:{$ne:'ARCHIVED'}}),Contract.countDocuments({companyId:cid,status:{$ne:'ARCHIVED'}}),WorkOrder.countDocuments({companyId:cid,status:{$ne:'ARCHIVED'}}),
  WorkPackage.aggregate([{$match:{companyId:cid}},{$group:{_id:'$status',count:{$sum:1},assignedQuantity:{$sum:{$ifNull:['$assignedQuantity',0]}}}}]),
  BeneficiaryContext.aggregate([{$match:{companyId:cid}},{$lookup:{from:'farmers',localField:'farmerId',foreignField:'_id',as:'farmer'}},{$unwind:{path:'$farmer',preserveNullAndEmptyArrays:true}},{$group:{_id:{$ifNull:['$farmer.applicationStatus','UNKNOWN']},count:{$sum:1}}}]),
  PurchaseOrder.aggregate([{$match:{companyId:cid}},{$group:{_id:'$status',count:{$sum:1}}}]),
  InventoryBalance.aggregate([{$match:{companyId:cid}},{$group:{_id:null,onHand:{$sum:{$ifNull:['$onHand',0]}},allocated:{$sum:{$ifNull:['$allocated',0]}},inTransit:{$sum:{$ifNull:['$inTransit',0]}}}}]),
  Shipment.aggregate([{$match:{companyId:cid}},{$group:{_id:'$status',count:{$sum:1}}}]),
  Shipment.countDocuments({companyId:cid,status:{$in:['DISPATCHED','IN_TRANSIT','PARTIAL']},eta:{$lt:new Date()}}),
  Driver.aggregate([{$match:{companyId:cid}},{$group:{_id:'$status',count:{$sum:1}}}]),Vehicle.aggregate([{$match:{companyId:cid}},{$group:{_id:'$status',count:{$sum:1}}}]),
  ServiceCase.aggregate([{$match:{companyId:cid}},{$group:{_id:'$status',count:{$sum:1}}}]),CommercialClaim.aggregate([{$match:{companyId:cid}},{$group:{_id:'$status',count:{$sum:1},amount:{$sum:{$ifNull:['$approvedAmount',0]}}}}]),Notification.countDocuments({companyId:cid,readAt:null})
 ]);
 return{generatedAt:new Date().toISOString(),delivery:{programs,contracts,workOrders,workPackages:groupToObject(wpStatus),beneficiaryExecution:groupToObject(beneficiaryStatus)},supply:{purchaseOrders:groupToObject(poStatus),inventory:stock[0]||{onHand:0,allocated:0,inTransit:0},shipments:groupToObject(shipmentStatus),overdueShipments,drivers:groupToObject(drivers),vehicles:groupToObject(vehicles)},service:{cases:groupToObject(serviceStatus)},finance:{claims:groupToObject(claimStatus),approvedClaimValue:(claimStatus||[]).reduce((n,x)=>n+Number(x.amount||0),0)},attention:{unreadNotifications:unread}};
}
exports.status=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const result=await ai.health();res.json({...result,company:{id:c._id,name:c.name}})};
exports.brief=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;if(!ai.enabled())return res.status(503).json({message:'Operations intelligence is not configured on the API service.'});const scope=String(req.body.scope||'EXECUTIVE').toUpperCase();const allowed=new Set(['EXECUTIVE','DELIVERY','SUPPLY','SERVICE','FINANCE']);if(!allowed.has(scope))return res.status(400).json({message:'Unsupported AI scope.'});const facts=await buildFacts(c._id);let scopedFacts=facts;if(scope==='DELIVERY')scopedFacts={generatedAt:facts.generatedAt,delivery:facts.delivery,attention:facts.attention};if(scope==='SUPPLY')scopedFacts={generatedAt:facts.generatedAt,supply:facts.supply,attention:facts.attention};if(scope==='SERVICE')scopedFacts={generatedAt:facts.generatedAt,service:facts.service,delivery:facts.delivery,attention:facts.attention};if(scope==='FINANCE')scopedFacts={generatedAt:facts.generatedAt,finance:facts.finance,supply:facts.supply,attention:facts.attention};try{const brief=await ai.operationsBrief({scope,question:req.body.question,facts:scopedFacts});if(!brief)return res.status(502).json({message:'Operations intelligence returned no usable response.'});await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'AI_OPERATIONS_BRIEF_GENERATED',entityType:'Organization',entityId:c._id,after:{scope,model:ai.MODEL(),question:String(req.body.question||'').slice(0,240)}});res.json({scope,generatedAt:new Date(),brief,factsAsOf:facts.generatedAt});}catch(error){res.status(502).json({message:'Operations intelligence request failed.',detail:String(error.message||error).slice(0,300)})}};


exports.scan=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const jobs=['service_sla','claim_sla','warranty','insurance','replenishment'];const results=[];for(const job of jobs){const run=await automationEngine.executeJob(job,{companyId:c._id,trigger:'INTELLIGENCE_SCAN',requestedBy:req.platformUser._id});results.push({job,status:run.status,metrics:run.metrics||{},errors:run.errors||[]});}await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'OPERATIONS_INTELLIGENCE_SCAN',entityType:'Organization',entityId:c._id,after:{jobs:results.map(x=>({job:x.job,status:x.status}))}});res.json({completedAt:new Date(),results});};
