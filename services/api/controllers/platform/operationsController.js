const mongoose=require('mongoose');
const crypto=require('crypto');
const XLSX=require('xlsx');
const Organization=require('../../models/platform/Organization');
const Program=require('../../models/platform/Program');
const Contract=require('../../models/platform/Contract');
const WorkOrder=require('../../models/platform/WorkOrder');
const WorkPackage=require('../../models/platform/WorkPackage');
const BeneficiaryContext=require('../../models/platform/BeneficiaryContext');
const ImportBatch=require('../../models/platform/ImportBatch');
const Farmer=require('../../models/Farmer');
const InstalledAsset=require('../../models/platform/InstalledAsset');
const MaterialIssue=require('../../models/platform/MaterialIssue');
const ServiceCase=require('../../models/platform/ServiceCase');
const ComplianceRecord=require('../../models/platform/ComplianceRecord');
const EvidenceRequirement=require('../../models/platform/EvidenceRequirement');
const EvidenceSubmission=require('../../models/platform/EvidenceSubmission');
const Shipment=require('../../models/platform/Shipment');
const platformAudit=require('../../utils/platformAudit');
const {materialReconciliation}=require('../../utils/inventoryTrace');

const companyIdFor=(req)=> req.platformUser.role==='platform_superadmin' ? (req.params.companyId||req.query.companyId||req.body.companyId) : String(req.tenant.companyId||'');
const ensureCompany=async(req,res)=>{ const companyId=companyIdFor(req); if(!companyId){res.status(400).json({message:'Company context is required.'});return null;} const c=await Organization.findOne({_id:companyId,type:'COMPANY',status:{$ne:'ARCHIVED'}}); if(!c){res.status(404).json({message:'Company not found.'});return null;} return c; };
const text=(v)=>String(v??'').trim();
const validId=v=>mongoose.isValidObjectId(v);
const safeRegex=v=>new RegExp(String(v||'').slice(0,100).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');

exports.dashboard=async(req,res)=>{
 const company=await ensureCompany(req,res); if(!company)return;
 const q={companyId:company._id};
 const period=['week','month','year'].includes(String(req.query.period||''))?String(req.query.period):'month';
 const now=new Date(),start=new Date(now);
 if(period==='week')start.setUTCDate(start.getUTCDate()-6);
 else if(period==='year')start.setUTCMonth(start.getUTCMonth()-11,1);
 else start.setUTCDate(start.getUTCDate()-29);
 start.setUTCHours(0,0,0,0);
 const bucketFormat=period==='year'?'%Y-%m':'%Y-%m-%d';
 const [programs,contracts,workOrders,workPackages,agencies,beneficiaries,pendingPackages]=await Promise.all([
   Program.countDocuments(q),Contract.countDocuments(q),WorkOrder.countDocuments(q),WorkPackage.countDocuments(q),
   Organization.countDocuments({type:'AGENCY',parentOrganization:company._id,status:'ACTIVE'}),BeneficiaryContext.countDocuments(q),
   WorkPackage.countDocuments({...q,status:{$in:['READY','ASSIGNED','IN_PROGRESS','BLOCKED']}})
 ]);
 const [packageAgg,rollup,surveyTrend,installationTrend]=await Promise.all([
  WorkPackage.aggregate([{$match:{companyId:company._id}},{$group:{_id:'$status',count:{$sum:1},quantity:{$sum:'$assignedQuantity'}}}]),
  BeneficiaryContext.aggregate([
   {$match:q},
   {$lookup:{from:Farmer.collection.name,localField:'farmerId',foreignField:'_id',as:'farmer'}},
   {$unwind:{path:'$farmer',preserveNullAndEmptyArrays:false}},
   {$lookup:{from:WorkPackage.collection.name,localField:'workPackageId',foreignField:'_id',as:'pkg'}},
   {$unwind:{path:'$pkg',preserveNullAndEmptyArrays:true}},
   {$project:{agencyId:1,app:{$ifNull:['$farmer.applicationStatus','Pending']},survey:{$ifNull:['$farmer.inspectionStatus','Pending']},district:{$ifNull:['$farmer.district',{$ifNull:['$pkg.geography.district','Unspecified']}]},state:{$ifNull:['$pkg.geography.state','Unspecified']}}},
   {$facet:{
    beneficiaryStatus:[{$group:{_id:'$app',count:{$sum:1}}},{$sort:{count:-1}}],
    surveyStatus:[{$group:{_id:'$survey',count:{$sum:1}}},{$sort:{count:-1}}],
    districts:[{$group:{_id:'$district',count:{$sum:1},completed:{$sum:{$cond:[{$in:['$app',['Installation Completed','Closed']]},1,0]}},complaints:{$sum:{$cond:[{$eq:['$app','Complaint Raised']},1,0]}},inProgress:{$sum:{$cond:[{$and:[{$not:[{$in:['$app',['Installation Completed','Closed']]}]},{$ne:['$app','Complaint Raised']}]},1,0]}},agencies:{$addToSet:'$agencyId'}}},{$project:{_id:0,district:'$_id',count:1,completed:1,complaints:1,inProgress:1,agencies:{$size:{$filter:{input:'$agencies',as:'a',cond:{$ne:['$$a',null]}}}},completionPercent:{$cond:[{$gt:['$count',0]},{$round:[{$multiply:[{$divide:['$completed','$count']},100]},0]},0]}}},{$sort:{count:-1}}],
    states:[{$group:{_id:'$state',count:{$sum:1},completed:{$sum:{$cond:[{$in:['$app',['Installation Completed','Closed']]},1,0]}},complaints:{$sum:{$cond:[{$eq:['$app','Complaint Raised']},1,0]}},inProgress:{$sum:{$cond:[{$and:[{$not:[{$in:['$app',['Installation Completed','Closed']]}]},{$ne:['$app','Complaint Raised']}]},1,0]}},agencies:{$addToSet:'$agencyId'},districts:{$addToSet:'$district'}}},{$project:{_id:0,state:'$_id',count:1,completed:1,complaints:1,inProgress:1,agencies:{$size:{$filter:{input:'$agencies',as:'a',cond:{$ne:['$$a',null]}}}},districts:{$size:{$filter:{input:'$districts',as:'d',cond:{$and:[{$ne:['$$d',null]},{$ne:['$$d','']}]}}}},completionPercent:{$cond:[{$gt:['$count',0]},{$round:[{$multiply:[{$divide:['$completed','$count']},100]},0]},0]}}},{$sort:{count:-1}}]
   }}
  ]),
  EvidenceSubmission.aggregate([{$match:{companyId:company._id,stage:'SURVEY',status:{$in:['SUBMITTED','VERIFIED']},updatedAt:{$gte:start}}},{$group:{_id:'$farmerId',eventAt:{$max:'$updatedAt'}}},{$group:{_id:{$dateToString:{format:bucketFormat,date:'$eventAt',timezone:'UTC'}},count:{$sum:1}}},{$sort:{_id:1}}]),
  InstalledAsset.aggregate([{$match:{companyId:company._id,installedAt:{$gte:start}}},{$group:{_id:'$farmerId',eventAt:{$min:'$installedAt'}}},{$group:{_id:{$dateToString:{format:bucketFormat,date:'$eventAt',timezone:'UTC'}},count:{$sum:1}}},{$sort:{_id:1}}])
 ]);
 const summary=rollup?.[0]||{},trendMap=new Map();
 for(const x of surveyTrend||[])trendMap.set(x._id,{period:x._id,surveys:Number(x.count||0),installations:0});
 for(const x of installationTrend||[]){const row=trendMap.get(x._id)||{period:x._id,surveys:0,installations:0};row.installations=Number(x.count||0);trendMap.set(x._id,row)}
 const pad=n=>String(n).padStart(2,'0'),keyFor=d=>period==='year'?`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}`:`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;const cursor=new Date(start);while(cursor<=now){const key=keyFor(cursor);if(!trendMap.has(key))trendMap.set(key,{period:key,surveys:0,installations:0});if(period==='year')cursor.setUTCMonth(cursor.getUTCMonth()+1,1);else cursor.setUTCDate(cursor.getUTCDate()+1)}
 res.json({company:{id:company._id,name:company.name,code:company.code},period,trend:[...trendMap.values()].sort((a,b)=>String(a.period).localeCompare(String(b.period))),programs,contracts,workOrders,workPackages,agencies,beneficiaries,pendingPackages,packageStatus:packageAgg,beneficiaryStatus:(summary.beneficiaryStatus||[]).map(x=>({status:x._id,count:x.count})),surveyStatus:(summary.surveyStatus||[]).map(x=>({status:x._id,count:x.count})),states:summary.states||[],districts:summary.districts||[]});
};


const parseSiteLocation=(value)=>{const parts=String(value||'').split(',').map(x=>Number(String(x).trim()));return parts.length>=2&&Number.isFinite(parts[0])&&Number.isFinite(parts[1])?{latitude:parts[0],longitude:parts[1]}:null};
exports.geoOverview=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;
 const ctxFilter={companyId:c._id};
 for(const [key,value] of [['programId',req.query.programId],['workOrderId',req.query.workOrderId],['workPackageId',req.query.workPackageId],['agencyId',req.query.agencyId]])if(value&&validId(value))ctxFilter[key]=value;
 if(req.query.contractId&&validId(req.query.contractId)){const ids=(await WorkOrder.find({companyId:c._id,contractId:req.query.contractId}).select('_id').lean()).map(x=>x._id);if(ctxFilter.workOrderId&&!ids.some(id=>String(id)===String(ctxFilter.workOrderId)))return res.json({pins:[],total:0,statuses:[],districts:[]});if(!ctxFilter.workOrderId)ctxFilter.workOrderId={$in:ids};}
 if(req.query.state){const pf={companyId:c._id,'geography.state':text(req.query.state)};if(ctxFilter.programId)pf.programId=ctxFilter.programId;if(ctxFilter.agencyId)pf.agencyId=ctxFilter.agencyId;const ids=(await WorkPackage.find(pf).select('_id').lean()).map(x=>x._id);if(ctxFilter.workPackageId&&!ids.some(id=>String(id)===String(ctxFilter.workPackageId)))return res.json({pins:[],total:0,statuses:[],districts:[]});if(!ctxFilter.workPackageId)ctxFilter.workPackageId={$in:ids};}
 const contexts=await BeneficiaryContext.find(ctxFilter).select('farmerId agencyId workPackageId programId workOrderId').populate('farmerId').populate('agencyId','name code').populate('workPackageId','code name status geography').populate('programId','name code scheme financialYear').populate('workOrderId','number title contractId').lean();
 const farmerIds=contexts.map(x=>x.farmerId?._id||x.farmerId).filter(Boolean);
 const evidence=farmerIds.length?await EvidenceSubmission.find({companyId:c._id,farmerId:{$in:farmerIds},'captureGeo.latitude':{$exists:true},'captureGeo.longitude':{$exists:true}}).select('farmerId captureGeo updatedAt').sort({updatedAt:-1}).lean():[];
 const geoByFarmer=new Map();for(const e of evidence){const k=String(e.farmerId);if(!geoByFarmer.has(k))geoByFarmer.set(k,e.captureGeo)}
 const pins=[];for(const ctx of contexts){const f=ctx.farmerId;if(!f)continue;if(req.query.status&&f.applicationStatus!==req.query.status)continue;if(req.query.district&&f.district!==req.query.district)continue;if(req.query.taluka&&f.taluka!==req.query.taluka)continue;if(req.query.village&&f.village!==req.query.village)continue;if(req.query.survey&&f.inspectionStatus!==req.query.survey)continue;if(req.query.scheme&&f.scheme!==req.query.scheme)continue;const id=String(f._id);const geo=geoByFarmer.get(id)||parseSiteLocation(f.siteLocation);if(!geo)continue;pins.push({farmerId:id,beneficiaryId:f.beneficiaryId,name:f.beneficiaryName,mobile:f.mobile,status:f.applicationStatus||'Pending',surveyStatus:f.inspectionStatus||'Pending',district:f.district||'',taluka:f.taluka||'',village:f.village||'',scheme:f.scheme||'',latitude:Number(geo.latitude),longitude:Number(geo.longitude),accuracy:Number(geo.accuracy||0),capturedAt:geo.capturedAt||null,geoSource:geoByFarmer.has(id)?'Evidence':'Site record',agency:ctx.agencyId?{id:ctx.agencyId._id,name:ctx.agencyId.name,code:ctx.agencyId.code}:null,program:ctx.programId?{id:ctx.programId._id,name:ctx.programId.name,code:ctx.programId.code}:null,workOrder:ctx.workOrderId?{id:ctx.workOrderId._id,number:ctx.workOrderId.number,title:ctx.workOrderId.title,contractId:ctx.workOrderId.contractId}:null,workPackage:ctx.workPackageId?{id:ctx.workPackageId._id,code:ctx.workPackageId.code,name:ctx.workPackageId.name,status:ctx.workPackageId.status,geography:ctx.workPackageId.geography}:null});}
 const statusCounts={},districtCounts={};for(const p of pins){statusCounts[p.status]=(statusCounts[p.status]||0)+1;districtCounts[p.district]=(districtCounts[p.district]||0)+1;}
 res.json({pins,total:pins.length,statuses:Object.entries(statusCounts).map(([status,count])=>({status,count})),districts:Object.entries(districtCounts).map(([district,count])=>({district,count})).sort((a,b)=>b.count-a.count)});
};

exports.portfolioOverview=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;
 const base={companyId:c._id};
 const [programs,contracts,workOrders,packages,agencies,beneficiaryRollup]=await Promise.all([
  Program.find(base).select('name code authority scheme component financialYear sanctionedQuantity contractValue status createdAt updatedAt').sort({createdAt:-1}).lean(),
  Contract.find(base).select('programId type number title authority sanctionedQuantity contractValue status createdAt updatedAt').populate('programId','name code scheme financialYear').sort({createdAt:-1}).lean(),
  WorkOrder.find(base).select('programId contractId number title sanctionedQuantity contractValue status createdAt updatedAt').populate('programId','name code scheme financialYear').populate('contractId','number title type').sort({createdAt:-1}).lean(),
  WorkPackage.find(base).select('programId workOrderId agencyId code name geography dueDate status assignedQuantity assignedAt createdAt updatedAt').populate('programId','name code scheme financialYear').populate('workOrderId','number title contractId').populate('agencyId','name code state contact').sort({createdAt:-1}).lean(),
  Organization.find({type:'AGENCY',parentOrganization:c._id,status:{$ne:'ARCHIVED'}}).select('name code state status contact createdAt updatedAt').sort({name:1}).lean(),
  BeneficiaryContext.aggregate([
   {$match:base},
   {$facet:{
    hierarchy:[{$group:{_id:{programId:'$programId',workOrderId:'$workOrderId',workPackageId:'$workPackageId',agencyId:'$agencyId'},count:{$sum:1}}}],
    agency:[
     {$lookup:{from:Farmer.collection.name,localField:'farmerId',foreignField:'_id',as:'farmer'}},
     {$unwind:{path:'$farmer',preserveNullAndEmptyArrays:true}},
     {$group:{_id:'$agencyId',beneficiaries:{$sum:1},completed:{$sum:{$cond:[{$in:['$farmer.applicationStatus',['Installation Completed','Closed']]},1,0]}},pendingSurvey:{$sum:{$cond:[{$or:[{$eq:[{$ifNull:['$farmer.inspectionStatus','']},'']},{$not:[{$in:['$farmer.inspectionStatus',['Completed','Approved']]}]}]},1,0]}},issues:{$sum:{$cond:[{$or:[{$eq:['$farmer.applicationStatus','Complaint Raised']},{$and:[{$ne:[{$ifNull:['$farmer.complaintStatus','']},'']},{$not:[{$in:['$farmer.complaintStatus',['Resolved','Closed']]}]}]}]},1,0]}},districts:{$addToSet:'$farmer.district'},lastActivity:{$max:{$ifNull:['$farmer.updatedAt','$assignedAt']}}}}
    ]
   }}]
  )
 ]);
 const hierarchyGroups=beneficiaryRollup?.[0]?.hierarchy||[],agencyGroups=beneficiaryRollup?.[0]?.agency||[];
 const byProgram=new Map(),byWorkOrder=new Map(),byPackage=new Map(),byAgency=new Map();
 for(const g of hierarchyGroups){const n=Number(g.count||0),id=g._id||{};for(const [map,key] of [[byProgram,id.programId],[byWorkOrder,id.workOrderId],[byPackage,id.workPackageId],[byAgency,id.agencyId]])if(key)map.set(String(key),(map.get(String(key))||0)+n)}
 const contractsByProgram=new Map(),woByProgram=new Map(),woCountByContract=new Map(),pkgCountByWo=new Map(),pkgCountByProgram=new Map(),pkgCountByAgency=new Map(),contractBeneficiaries=new Map();
 for(const cn of contracts){const pid=String(cn.programId?._id||cn.programId||'');if(pid)contractsByProgram.set(pid,(contractsByProgram.get(pid)||0)+1)}
 for(const w of workOrders){const pid=String(w.programId?._id||w.programId||''),cid=String(w.contractId?._id||w.contractId||'');if(pid)woByProgram.set(pid,(woByProgram.get(pid)||0)+1);if(cid){woCountByContract.set(cid,(woCountByContract.get(cid)||0)+1);contractBeneficiaries.set(cid,(contractBeneficiaries.get(cid)||0)+(byWorkOrder.get(String(w._id))||0))}}
 for(const k of packages){const wo=String(k.workOrderId?._id||k.workOrderId||''),pr=String(k.programId?._id||k.programId||''),ag=String(k.agencyId?._id||k.agencyId||'');if(wo)pkgCountByWo.set(wo,(pkgCountByWo.get(wo)||0)+1);if(pr)pkgCountByProgram.set(pr,(pkgCountByProgram.get(pr)||0)+1);if(ag)pkgCountByAgency.set(ag,(pkgCountByAgency.get(ag)||0)+1)}
 const agencyPerformance=new Map(agencyGroups.filter(x=>x._id).map(x=>[String(x._id),{beneficiaries:Number(x.beneficiaries||0),completed:Number(x.completed||0),inProgress:Math.max(0,Number(x.beneficiaries||0)-Number(x.completed||0)),pendingSurvey:Number(x.pendingSurvey||0),issues:Number(x.issues||0),districts:(x.districts||[]).filter(Boolean).length,lastActivity:x.lastActivity||null}]));
 const packageStatusByAgency=new Map();for(const pkg of packages){const aid=String(pkg.agencyId?._id||pkg.agencyId||'');if(!aid)continue;let m=packageStatusByAgency.get(aid);if(!m){m={active:0,completed:0,blocked:0};packageStatusByAgency.set(aid,m)}if(['COMPLETED','CLOSED'].includes(pkg.status))m.completed++;else m.active++;if(pkg.status==='BLOCKED')m.blocked++;}
 res.json({
  programs:programs.map(x=>({...x,metrics:{contracts:contractsByProgram.get(String(x._id))||0,workOrders:woByProgram.get(String(x._id))||0,workPackages:pkgCountByProgram.get(String(x._id))||0,beneficiaries:byProgram.get(String(x._id))||0}})),
  contracts:contracts.map(x=>({...x,metrics:{workOrders:woCountByContract.get(String(x._id))||0,beneficiaries:contractBeneficiaries.get(String(x._id))||0}})),
  workOrders:workOrders.map(x=>({...x,metrics:{workPackages:pkgCountByWo.get(String(x._id))||0,beneficiaries:byWorkOrder.get(String(x._id))||0}})),
  workPackages:packages.map(x=>({...x,metrics:{beneficiaries:byPackage.get(String(x._id))||0}})),
  agencies:agencies.map(x=>{const perf=agencyPerformance.get(String(x._id))||{beneficiaries:0,completed:0,inProgress:0,pendingSurvey:0,issues:0,districts:0,lastActivity:null},pkg=packageStatusByAgency.get(String(x._id))||{active:0,completed:0,blocked:0};const total=Number(perf.beneficiaries||0);return {...x,metrics:{workPackages:pkgCountByAgency.get(String(x._id))||0,beneficiaries:byAgency.get(String(x._id))||0,completed:perf.completed,inProgress:perf.inProgress,pendingSurvey:perf.pendingSurvey,issues:perf.issues,districts:perf.districts,completionPercent:total?Math.round(perf.completed/total*100):0,activePackages:pkg.active,completedPackages:pkg.completed,blockedPackages:pkg.blocked,lastActivity:perf.lastActivity}}})
 });
};

exports.beneficiaryFilterOptions=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;
 const contexts=await BeneficiaryContext.find({companyId:c._id}).select('farmerId').lean();
 const ids=contexts.map(x=>x.farmerId).filter(Boolean);
 const match=ids.length?{_id:{$in:ids}}:{_id:null};
 const [districts,talukas,villages,schemes,statuses,surveys]=await Promise.all([
  Farmer.distinct('district',match),Farmer.distinct('taluka',match),Farmer.distinct('village',match),Farmer.distinct('scheme',match),Farmer.distinct('applicationStatus',match),Farmer.distinct('inspectionStatus',match)
 ]);
 const clean=a=>a.filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b)));
 res.json({districts:clean(districts),talukas:clean(talukas),villages:clean(villages),schemes:clean(schemes),statuses:clean(statuses),surveys:clean(surveys)});
};

exports.listPrograms=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;res.json({items:await Program.find({companyId:c._id}).sort({createdAt:-1}).lean()});};
exports.createProgram=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const b=req.body; if(!text(b.name)||!text(b.code))return res.status(400).json({message:'Program name and code are required.'}); const item=await Program.create({companyId:c._id,name:text(b.name),code:text(b.code).toUpperCase(),country:b.country||c.country||'India',state:b.state,authority:b.authority,scheme:b.scheme,component:b.component,financialYear:b.financialYear,sanctionedQuantity:Number(b.sanctionedQuantity||0),contractValue:Number(b.contractValue||0),currency:b.currency||'INR',startDate:b.startDate||undefined,endDate:b.endDate||undefined,status:b.status||'DRAFT'}); await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'PROGRAM_CREATED',entityType:'Program',entityId:item._id,after:item.toObject()});res.status(201).json({item});};

exports.listContracts=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const filter={companyId:c._id};if(req.query.programId)filter.programId=req.query.programId;res.json({items:await Contract.find(filter).populate('programId','name code').sort({createdAt:-1}).lean()});};
exports.createContract=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const b=req.body;if(!b.programId||!text(b.number)||!text(b.title))return res.status(400).json({message:'Program, contract/LOA number and title are required.'}); const prog=await Program.findOne({_id:b.programId,companyId:c._id});if(!prog)return res.status(400).json({message:'Invalid program.'});const item=await Contract.create({companyId:c._id,programId:prog._id,type:b.type||'LOA',number:text(b.number),title:text(b.title),authority:b.authority,sanctionedQuantity:Number(b.sanctionedQuantity||0),contractValue:Number(b.contractValue||0),currency:b.currency||'INR',awardDate:b.awardDate||undefined,startDate:b.startDate||undefined,endDate:b.endDate||undefined,status:b.status||'DRAFT'});await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'CONTRACT_CREATED',entityType:'Contract',entityId:item._id,after:item.toObject()});res.status(201).json({item});};

exports.listWorkOrders=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;res.json({items:await WorkOrder.find({companyId:c._id}).populate('programId','name code').populate('contractId','number title').sort({createdAt:-1}).lean()});};
exports.createWorkOrder=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const b=req.body;if(!b.programId||!text(b.number))return res.status(400).json({message:'Program and work order number are required.'}); const prog=await Program.findOne({_id:b.programId,companyId:c._id});if(!prog)return res.status(400).json({message:'Invalid program.'});let contract=null;if(b.contractId){contract=await Contract.findOne({_id:b.contractId,companyId:c._id,programId:prog._id});if(!contract)return res.status(400).json({message:'Invalid contract/LOA.'});}const item=await WorkOrder.create({companyId:c._id,programId:prog._id,contractId:contract?._id||null,number:text(b.number),title:text(b.title),loaNumber:contract?.number||text(b.loaNumber),tenderNumber:text(b.tenderNumber),sanctionedQuantity:Number(b.sanctionedQuantity||0),contractValue:Number(b.contractValue||0),currency:b.currency||'INR',startDate:b.startDate||undefined,dueDate:b.dueDate||undefined,status:b.status||'DRAFT'});await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'WORK_ORDER_CREATED',entityType:'WorkOrder',entityId:item._id,after:item.toObject()});res.status(201).json({item});};

exports.listAgencies=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;res.json({items:await Organization.find({type:'AGENCY',parentOrganization:c._id}).sort({createdAt:-1}).lean()});};
exports.createAgency=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const b=req.body;if(!text(b.name)||!text(b.code))return res.status(400).json({message:'Agency name and code are required.'});const item=await Organization.create({name:text(b.name),code:text(b.code).toUpperCase(),type:'AGENCY',parentOrganization:c._id,country:b.country||c.country||'India',state:b.state||c.state,status:b.status||'ACTIVE',contact:b.contact||{},address:b.address||{},metadata:{...(b.metadata||{}),onboardedByCompany:true}});await platformAudit(req,{companyId:c._id,organizationId:item._id,action:'AGENCY_CREATED',entityType:'Organization',entityId:item._id,after:item.toObject()});res.status(201).json({item});};

exports.listWorkPackages=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;res.json({items:await WorkPackage.find({companyId:c._id}).populate('programId','name code').populate('workOrderId','number title').populate('agencyId','name code').sort({createdAt:-1}).lean()});};
exports.createWorkPackage=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const b=req.body;if(!b.programId||!b.workOrderId||!text(b.code))return res.status(400).json({message:'Program, work order and package code are required.'});const wo=await WorkOrder.findOne({_id:b.workOrderId,companyId:c._id,programId:b.programId});if(!wo)return res.status(400).json({message:'Invalid work order/program combination.'});let agency=null;if(b.agencyId){agency=await Organization.findOne({_id:b.agencyId,type:'AGENCY',parentOrganization:c._id});if(!agency)return res.status(400).json({message:'Invalid agency.'});}const item=await WorkPackage.create({companyId:c._id,programId:b.programId,workOrderId:wo._id,code:text(b.code).toUpperCase(),name:text(b.name),agencyId:agency ? agency._id : null,geography:b.geography||{},assignedQuantity:Number(b.assignedQuantity||0),assignedAt:agency?new Date():undefined,dueDate:b.dueDate||undefined,status:agency?'ASSIGNED':(b.status||'READY'),commercialTerms:b.commercialTerms||{}});await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'WORK_PACKAGE_CREATED',entityType:'WorkPackage',entityId:item._id,after:item.toObject()});res.status(201).json({item});};
exports.assignPackage=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const pkg=await WorkPackage.findOne({_id:req.params.id,companyId:c._id});if(!pkg)return res.status(404).json({message:'Work package not found.'});const agency=await Organization.findOne({_id:req.body.agencyId,type:'AGENCY',parentOrganization:c._id,status:'ACTIVE'});if(!agency)return res.status(400).json({message:'Select an active company agency.'});const before=pkg.toObject();pkg.agencyId=agency._id;pkg.assignedAt=new Date();pkg.status='ASSIGNED';await pkg.save();await BeneficiaryContext.updateMany({companyId:c._id,workPackageId:pkg._id},{$set:{agencyId:agency._id,assignedAt:new Date()},$push:{assignmentHistory:{agencyId:agency._id,assignedAt:new Date(),reason:text(req.body.reason)||'Work package assignment'}}});await platformAudit(req,{companyId:c._id,organizationId:agency._id,action:'WORK_PACKAGE_ASSIGNED',entityType:'WorkPackage',entityId:pkg._id,before,after:pkg.toObject()});res.json({item:pkg});};


const assignDefined=(target,body,fields)=>{for(const f of fields)if(body[f]!==undefined)target[f]=body[f];};
const closeEntity=async(req,res,Model,entityType,action)=>{const c=await ensureCompany(req,res);if(!c)return;const item=await Model.findOne({_id:req.params.id,companyId:c._id});if(!item)return res.status(404).json({message:`${entityType} not found.`});const before=item.toObject();item.status='CLOSED';await item.save();await platformAudit(req,{companyId:c._id,organizationId:c._id,action,entityType,entityId:item._id,before,after:item.toObject()});res.json({item});};

exports.updateProgram=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const item=await Program.findOne({_id:req.params.id,companyId:c._id});if(!item)return res.status(404).json({message:'Program not found.'});const before=item.toObject();assignDefined(item,req.body,['name','country','state','authority','scheme','component','financialYear','currency','startDate','endDate','status','milestoneConfig','slaConfig']);if(req.body.code!==undefined)item.code=text(req.body.code).toUpperCase();if(req.body.sanctionedQuantity!==undefined)item.sanctionedQuantity=Number(req.body.sanctionedQuantity||0);if(req.body.contractValue!==undefined)item.contractValue=Number(req.body.contractValue||0);await item.save();await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'PROGRAM_UPDATED',entityType:'Program',entityId:item._id,before,after:item.toObject()});res.json({item});};
exports.closeProgram=(req,res)=>closeEntity(req,res,Program,'Program','PROGRAM_CLOSED');

exports.updateContract=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const item=await Contract.findOne({_id:req.params.id,companyId:c._id});if(!item)return res.status(404).json({message:'Contract not found.'});const before=item.toObject();if(req.body.programId!==undefined){const p=await Program.findOne({_id:req.body.programId,companyId:c._id});if(!p)return res.status(400).json({message:'Invalid program.'});item.programId=p._id;}assignDefined(item,req.body,['type','number','title','authority','currency','awardDate','startDate','endDate','status','metadata']);if(req.body.sanctionedQuantity!==undefined)item.sanctionedQuantity=Number(req.body.sanctionedQuantity||0);if(req.body.contractValue!==undefined)item.contractValue=Number(req.body.contractValue||0);await item.save();await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'CONTRACT_UPDATED',entityType:'Contract',entityId:item._id,before,after:item.toObject()});res.json({item});};
exports.closeContract=(req,res)=>closeEntity(req,res,Contract,'Contract','CONTRACT_CLOSED');

exports.updateWorkOrder=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const item=await WorkOrder.findOne({_id:req.params.id,companyId:c._id});if(!item)return res.status(404).json({message:'Work order not found.'});const before=item.toObject();if(req.body.programId!==undefined){const p=await Program.findOne({_id:req.body.programId,companyId:c._id});if(!p)return res.status(400).json({message:'Invalid program.'});item.programId=p._id;}if(req.body.contractId!==undefined){if(!req.body.contractId)item.contractId=null;else{const ct=await Contract.findOne({_id:req.body.contractId,companyId:c._id,programId:item.programId});if(!ct)return res.status(400).json({message:'Invalid contract/LOA for this program.'});item.contractId=ct._id;item.loaNumber=ct.number;}}assignDefined(item,req.body,['number','title','loaNumber','tenderNumber','currency','startDate','dueDate','status','metadata']);if(req.body.sanctionedQuantity!==undefined)item.sanctionedQuantity=Number(req.body.sanctionedQuantity||0);if(req.body.contractValue!==undefined)item.contractValue=Number(req.body.contractValue||0);await item.save();await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'WORK_ORDER_UPDATED',entityType:'WorkOrder',entityId:item._id,before,after:item.toObject()});res.json({item});};
exports.closeWorkOrder=(req,res)=>closeEntity(req,res,WorkOrder,'WorkOrder','WORK_ORDER_CLOSED');

exports.updateAgency=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const item=await Organization.findOne({_id:req.params.id,type:'AGENCY',parentOrganization:c._id});if(!item)return res.status(404).json({message:'Agency not found.'});const before=item.toObject();assignDefined(item,req.body,['name','country','state','status','contact','address','metadata']);if(req.body.code!==undefined)item.code=text(req.body.code).toUpperCase();await item.save();await platformAudit(req,{companyId:c._id,organizationId:item._id,action:'AGENCY_UPDATED',entityType:'Organization',entityId:item._id,before,after:item.toObject()});res.json({item});};
exports.archiveAgency=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const item=await Organization.findOne({_id:req.params.id,type:'AGENCY',parentOrganization:c._id});if(!item)return res.status(404).json({message:'Agency not found.'});const activePackages=await WorkPackage.countDocuments({companyId:c._id,agencyId:item._id,status:{$nin:['COMPLETED','CLOSED']}});if(activePackages)return res.status(409).json({message:`Agency has ${activePackages} active work package(s). Reassign or close them before archiving.`});const before=item.toObject();item.status='ARCHIVED';await item.save();await platformAudit(req,{companyId:c._id,organizationId:item._id,action:'AGENCY_ARCHIVED',entityType:'Organization',entityId:item._id,before,after:item.toObject()});res.json({item});};

exports.updateWorkPackage=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const item=await WorkPackage.findOne({_id:req.params.id,companyId:c._id});if(!item)return res.status(404).json({message:'Work package not found.'});const before=item.toObject();if(req.body.agencyId!==undefined&&String(req.body.agencyId||'')!==String(item.agencyId||'')){if(!req.body.agencyId){item.agencyId=null;item.assignedAt=undefined;if(!['COMPLETED','CLOSED'].includes(item.status))item.status='READY';}else{const agency=await Organization.findOne({_id:req.body.agencyId,type:'AGENCY',parentOrganization:c._id,status:'ACTIVE'});if(!agency)return res.status(400).json({message:'Select an active company agency.'});item.agencyId=agency._id;item.assignedAt=new Date();if(!['COMPLETED','CLOSED'].includes(item.status))item.status='ASSIGNED';await BeneficiaryContext.updateMany({companyId:c._id,workPackageId:item._id},{$set:{agencyId:agency._id,assignedAt:new Date()},$push:{assignmentHistory:{agencyId:agency._id,assignedAt:new Date(),reason:text(req.body.reason)||'Work package update'}}});}}assignDefined(item,req.body,['name','geography','dueDate','status','commercialTerms']);await item.save();await platformAudit(req,{companyId:c._id,organizationId:item.agencyId||c._id,action:'WORK_PACKAGE_UPDATED',entityType:'WorkPackage',entityId:item._id,before,after:item.toObject()});res.json({item});};
exports.closeWorkPackage=(req,res)=>closeEntity(req,res,WorkPackage,'WorkPackage','WORK_PACKAGE_CLOSED');

exports.downloadBeneficiaryTemplate=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const rows=[{'Beneficiary ID':'APP-0001','Beneficiary Name':'Sample Farmer','Mobile':'9876543210','Aadhaar':'','Scheme':'','Land Address':'','Village':'','Taluka':'','District':'','Division':'','Circle':'','Zone':'','Pump HP':'5'}];const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Beneficiaries');const help=XLSX.utils.aoa_to_sheet([['Instructions'],['Do not rename Beneficiary ID or Beneficiary Name.'],['Mobile, Scheme, geography and Pump HP are mapped automatically when present.'],['Extra columns are accepted and preserved as Custom Fields on the beneficiary import context.'],['Use one beneficiary per row. Duplicate Beneficiary IDs are reported instead of silently overwritten.']]);XLSX.utils.book_append_sheet(wb,help,'Instructions');const buf=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition','attachment; filename="opsynq-beneficiary-import-template.xlsx"');res.send(buf);};
exports.downloadImportErrors=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const batch=await ImportBatch.findOne({_id:req.params.id,companyId:c._id,type:'BENEFICIARY_IMPORT'}).lean();if(!batch)return res.status(404).json({message:'Import batch not found.'});const rows=(batch.errors||[]).map(e=>({Row:e.row||'',Beneficiary_ID:e.beneficiaryId||'',Error:e.message||''}));const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{Row:'',Beneficiary_ID:'',Error:'No row errors recorded'}]);const csv=XLSX.utils.sheet_to_csv(ws);res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="beneficiary-import-errors-${batch._id}.csv"`);res.send('\ufeff'+csv);};

const rowVal=(row,names)=>{for(const n of names){if(row[n]!==undefined&&text(row[n]))return row[n];}return '';};
const BENEFICIARY_KNOWN_HEADERS=new Set(['beneficiaryId','Beneficiary ID','BeneficiaryId','Application ID','ApplicationId','beneficiaryName','Beneficiary Name','Farmer Name','Name','mobile','Mobile','Mobile Number','alternateMobileNumber','Alternate Mobile','aadharNo','Aadhar','Aadhaar','scheme','Scheme','landAddress','Land Address','Address','village','Village','taluka','Taluka','Block','district','District','divisionName','Division','circleName','Circle','zoneName','Zone','pumpHP','Pump HP','HP']);
const beneficiaryExtras=row=>Object.fromEntries(Object.entries(row||{}).filter(([k,v])=>!BENEFICIARY_KNOWN_HEADERS.has(k)&&text(v)!==''));
exports.importBeneficiaries=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;if(!req.file)return res.status(400).json({message:'Excel file is required.'});const {programId,workOrderId,workPackageId}=req.body;const pkg=await WorkPackage.findOne({_id:workPackageId,companyId:c._id,programId,workOrderId}).lean();if(!pkg)return res.status(400).json({message:'Valid program/work order/work package is required.'});if(!pkg.agencyId)return res.status(400).json({message:'Assign the work package to an agency before importing beneficiaries.'});const hash=crypto.createHash('sha256').update(req.file.buffer).digest('hex');const exists=await ImportBatch.findOne({companyId:c._id,fileHash:hash,type:'BENEFICIARY_IMPORT',status:'COMPLETED'});if(exists)return res.status(409).json({message:'This exact file was already imported.',batchId:exists._id});const wb=XLSX.read(req.file.buffer,{type:'buffer'});const sheet=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});const batch=await ImportBatch.create({companyId:c._id,type:'BENEFICIARY_IMPORT',sourceFileName:req.file.originalname,fileHash:hash,status:'PROCESSING',totalRows:rows.length,uploadedBy:req.platformUser._id,metadata:{programId,workOrderId,workPackageId,agencyId:pkg.agencyId}});let success=0,failed=0,skipped=0;const errors=[];for(let i=0;i<rows.length;i++){const row=rows[i];try{const beneficiaryId=text(rowVal(row,['beneficiaryId','Beneficiary ID','BeneficiaryId','Application ID','ApplicationId']));const beneficiaryName=text(rowVal(row,['beneficiaryName','Beneficiary Name','Farmer Name','Name']));if(!beneficiaryId||!beneficiaryName){failed++;errors.push({row:i+2,message:'Beneficiary ID/Application ID and Beneficiary Name are required.'});continue;}const duplicate=await Farmer.findOne({beneficiaryId});if(duplicate){const ctx=await BeneficiaryContext.findOne({farmerId:duplicate._id});if(ctx){skipped++;errors.push({row:i+2,beneficiaryId,message:'Already exists in Opsynq context.'});continue;}}
 const farmer=duplicate||await Farmer.create({beneficiaryId,beneficiaryName,mobile:text(rowVal(row,['mobile','Mobile','Mobile Number'])),alternateMobileNumber:text(rowVal(row,['alternateMobileNumber','Alternate Mobile'])),aadharNo:text(rowVal(row,['aadharNo','Aadhar','Aadhaar'])),scheme:text(rowVal(row,['scheme','Scheme']))||'',landAddress:text(rowVal(row,['landAddress','Land Address','Address'])),village:text(rowVal(row,['village','Village'])),taluka:text(rowVal(row,['taluka','Taluka','Block'])),district:text(rowVal(row,['district','District'])),divisionName:text(rowVal(row,['divisionName','Division'])),circleName:text(rowVal(row,['circleName','Circle'])),zoneName:text(rowVal(row,['zoneName','Zone'])),pumpHP:text(rowVal(row,['pumpHP','Pump HP','HP'])),excelFileName:req.file.originalname,excelUploadDate:new Date()});
 await BeneficiaryContext.create({farmerId:farmer._id,companyId:c._id,programId,workOrderId,workPackageId,agencyId:pkg.agencyId,sourceImportBatchId:batch._id,sourceRowNumber:i+2,sourceAuthority:text(req.body.sourceAuthority),originalData:row,normalizedData:{beneficiaryId,beneficiaryName,customFields:beneficiaryExtras(row)},validationStatus:'VALID',assignedAt:new Date(),assignmentHistory:[{agencyId:pkg.agencyId,assignedAt:new Date(),reason:'Initial bulk beneficiary import'}]});success++;}catch(err){failed++;errors.push({row:i+2,message:err.message});}}
batch.successRows=success;batch.failedRows=failed;batch.skippedRows=skipped;batch.errors=errors.slice(0,500);batch.status=failed&&success?'PARTIAL':failed&&!success?'FAILED':'COMPLETED';await batch.save();await WorkPackage.updateOne({_id:pkg._id},{$set:{assignedQuantity:await BeneficiaryContext.countDocuments({workPackageId:pkg._id})}});await platformAudit(req,{companyId:c._id,organizationId:pkg.agencyId,action:'BENEFICIARY_BULK_IMPORT',entityType:'ImportBatch',entityId:batch._id,after:{total:rows.length,success,failed,skipped,workPackageId}});res.status(201).json({batchId:batch._id,total:rows.length,success,failed,skipped,status:batch.status,errors:errors.slice(0,100)});};
exports.listImports=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;res.json({items:await ImportBatch.find({companyId:c._id,type:'BENEFICIARY_IMPORT'}).sort({createdAt:-1}).limit(100).lean()});};



const refreshPackageBeneficiaryCounts=async(ids=[])=>{for(const id of [...new Set(ids.filter(Boolean).map(String))]){if(!validId(id))continue;const count=await BeneficiaryContext.countDocuments({workPackageId:id});await WorkPackage.updateOne({_id:id},{$set:{assignedQuantity:count}});}};
const beneficiaryDependencyCount=async(companyId,farmerIds)=>{const q={companyId,farmerId:{$in:farmerIds}};const [assets,issues,cases,compliance,evidence]=await Promise.all([InstalledAsset.countDocuments(q),MaterialIssue.countDocuments(q),ServiceCase.countDocuments(q),ComplianceRecord.countDocuments(q),EvidenceSubmission.countDocuments(q)]);return assets+issues+cases+compliance+evidence;};
const beneficiaryIdExistsInCompany=async(companyId,beneficiaryId,exceptFarmerId=null)=>{const farmerIds=(await Farmer.find({beneficiaryId:text(beneficiaryId),...(exceptFarmerId?{_id:{$ne:exceptFarmerId}}:{})}).select('_id').lean()).map(x=>x._id);return farmerIds.length?!!(await BeneficiaryContext.exists({companyId,farmerId:{$in:farmerIds}})):false;};

exports.createBeneficiary=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;const b=req.body||{};
 if(!validId(b.workPackageId))return res.status(400).json({message:'A valid work package is required.'});
 const pkg=await WorkPackage.findOne({_id:b.workPackageId,companyId:c._id}).lean();if(!pkg)return res.status(404).json({message:'Work package not found in this company.'});
 if(!pkg.agencyId)return res.status(409).json({message:'Assign an agency to the work package before adding beneficiaries.'});
 const beneficiaryId=text(b.beneficiaryId),beneficiaryName=text(b.beneficiaryName);if(!beneficiaryId||!beneficiaryName)return res.status(400).json({message:'Beneficiary ID and beneficiary name are required.'});
 if(await beneficiaryIdExistsInCompany(c._id,beneficiaryId))return res.status(409).json({message:'Beneficiary ID already exists in this company.'});
 const farmer=await Farmer.create({beneficiaryId,beneficiaryName,mobile:text(b.mobile),alternateMobileNumber:text(b.alternateMobileNumber),scheme:text(b.scheme),landAddress:text(b.landAddress),village:text(b.village),taluka:text(b.taluka),district:text(b.district),divisionName:text(b.divisionName),circleName:text(b.circleName),zoneName:text(b.zoneName),pumpHP:text(b.pumpHP),inspectionStatus:b.inspectionStatus||'Pending',applicationStatus:b.applicationStatus||'Pending'});
 const ctx=await BeneficiaryContext.create({farmerId:farmer._id,companyId:c._id,programId:pkg.programId,workOrderId:pkg.workOrderId,workPackageId:pkg._id,agencyId:pkg.agencyId,sourceAuthority:text(b.sourceAuthority)||'Manual company entry',normalizedData:{beneficiaryId,beneficiaryName},validationStatus:'VALID',assignedAt:new Date(),assignmentHistory:[{agencyId:pkg.agencyId,assignedAt:new Date(),reason:'Manual company beneficiary creation'}]});
 await refreshPackageBeneficiaryCounts([pkg._id]);await platformAudit(req,{companyId:c._id,organizationId:pkg.agencyId,action:'BENEFICIARY_CREATED',entityType:'Farmer',entityId:farmer._id,after:{beneficiaryId,beneficiaryName,workPackageId:String(pkg._id),agencyId:String(pkg.agencyId)}});res.status(201).json({item:{context:ctx,farmer}});
};

exports.updateBeneficiary=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;if(!validId(req.params.farmerId))return res.status(400).json({message:'Invalid beneficiary id.'});
 const ctx=await BeneficiaryContext.findOne({companyId:c._id,farmerId:req.params.farmerId});if(!ctx)return res.status(404).json({message:'Beneficiary not found in this company.'});
 const farmer=await Farmer.findById(ctx.farmerId);if(!farmer)return res.status(404).json({message:'Beneficiary record not found.'});const before={farmer:farmer.toObject(),context:ctx.toObject()};
 const fields=['beneficiaryName','mobile','alternateMobileNumber','scheme','landAddress','village','taluka','district','divisionName','circleName','zoneName','pumpHP','inspectionStatus','applicationStatus','remarks'];for(const k of fields)if(req.body[k]!==undefined)farmer[k]=typeof req.body[k]==='string'?text(req.body[k]):req.body[k];
 if(req.body.beneficiaryId!==undefined){const next=text(req.body.beneficiaryId);if(!next)return res.status(400).json({message:'Beneficiary ID cannot be empty.'});if(await beneficiaryIdExistsInCompany(c._id,next,farmer._id))return res.status(409).json({message:'Beneficiary ID already exists in this company.'});farmer.beneficiaryId=next;}
 const oldPackage=String(ctx.workPackageId);if(req.body.workPackageId!==undefined&&String(req.body.workPackageId)!==oldPackage){if(!validId(req.body.workPackageId))return res.status(400).json({message:'Valid work package is required.'});const pkg=await WorkPackage.findOne({_id:req.body.workPackageId,companyId:c._id});if(!pkg)return res.status(404).json({message:'Work package not found in this company.'});if(!pkg.agencyId)return res.status(409).json({message:'Target work package must have an assigned agency.'});ctx.programId=pkg.programId;ctx.workOrderId=pkg.workOrderId;ctx.workPackageId=pkg._id;ctx.agencyId=pkg.agencyId;ctx.assignedAt=new Date();ctx.assignmentHistory.push({agencyId:pkg.agencyId,assignedAt:new Date(),reason:text(req.body.reason)||'Company beneficiary reassignment'});}
 await farmer.save();await ctx.save();await refreshPackageBeneficiaryCounts([oldPackage,ctx.workPackageId]);await platformAudit(req,{companyId:c._id,organizationId:ctx.agencyId,action:'BENEFICIARY_UPDATED',entityType:'Farmer',entityId:farmer._id,before,after:{farmer:farmer.toObject(),context:ctx.toObject()}});res.json({item:{context:ctx,farmer}});
};

exports.deleteBeneficiary=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;if(!validId(req.params.farmerId))return res.status(400).json({message:'Invalid beneficiary id.'});const reason=text(req.body?.reason);if(reason.length<3)return res.status(400).json({message:'Deletion reason is required.'});
 const ctx=await BeneficiaryContext.findOne({companyId:c._id,farmerId:req.params.farmerId}).lean();if(!ctx)return res.status(404).json({message:'Beneficiary not found in this company.'});const dependencies=await beneficiaryDependencyCount(c._id,[ctx.farmerId]);if(dependencies)return res.status(409).json({message:'This beneficiary has operational history and cannot be deleted. Close the record instead.'});const farmer=await Farmer.findById(ctx.farmerId).lean();
 await BeneficiaryContext.deleteOne({_id:ctx._id,companyId:c._id});await Farmer.deleteOne({_id:ctx.farmerId});await refreshPackageBeneficiaryCounts([ctx.workPackageId]);await platformAudit(req,{companyId:c._id,organizationId:ctx.agencyId,action:'BENEFICIARY_DELETED',entityType:'Farmer',entityId:ctx.farmerId,before:{farmer,context:ctx},after:{reason}});res.json({deleted:true});
};

exports.bulkDeleteBeneficiaries=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;const ids=Array.isArray(req.body?.ids)?[...new Set(req.body.ids.filter(validId).map(String))].slice(0,500):[],reason=text(req.body?.reason);if(!ids.length)return res.status(400).json({message:'Select at least one beneficiary.'});if(reason.length<3)return res.status(400).json({message:'Bulk deletion reason is required.'});const contexts=await BeneficiaryContext.find({companyId:c._id,farmerId:{$in:ids}}).lean();if(contexts.length!==ids.length)return res.status(403).json({message:'One or more selected beneficiaries are unavailable.'});const farmerIds=contexts.map(x=>x.farmerId),dependencies=await beneficiaryDependencyCount(c._id,farmerIds);if(dependencies)return res.status(409).json({message:'One or more selected beneficiaries have operational history and cannot be deleted.'});const farmers=await Farmer.find({_id:{$in:farmerIds}}).select('beneficiaryId beneficiaryName').lean();await BeneficiaryContext.deleteMany({companyId:c._id,farmerId:{$in:farmerIds}});await Farmer.deleteMany({_id:{$in:farmerIds}});await refreshPackageBeneficiaryCounts(contexts.map(x=>x.workPackageId));await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'BENEFICIARY_BULK_DELETED',entityType:'Farmer',before:{items:farmers},after:{ids,reason,count:ids.length},bulkOperationId:crypto.randomUUID()});res.json({deleted:ids.length});
};

exports.bulkUpdateAgencies=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;const ids=Array.isArray(req.body?.ids)?[...new Set(req.body.ids.filter(validId).map(String))].slice(0,200):[];if(!ids.length)return res.status(400).json({message:'Select at least one agency.'});const agencies=await Organization.find({_id:{$in:ids},type:'AGENCY',parentOrganization:c._id});if(agencies.length!==ids.length)return res.status(403).json({message:'One or more selected agencies are unavailable.'});const patch={};if(req.body.state!==undefined)patch.state=text(req.body.state);if(req.body.status!==undefined){const status=text(req.body.status).toUpperCase();if(!['PENDING','ACTIVE','SUSPENDED'].includes(status))return res.status(400).json({message:'Use bulk archive to archive agencies.'});patch.status=status;}if(!Object.keys(patch).length)return res.status(400).json({message:'Choose a status or state to update.'});const result=await Organization.updateMany({_id:{$in:ids},type:'AGENCY',parentOrganization:c._id},{$set:patch},{runValidators:true});await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'AGENCY_BULK_UPDATED',entityType:'Organization',after:{ids,patch,count:result.modifiedCount},bulkOperationId:crypto.randomUUID()});res.json({matched:result.matchedCount,modified:result.modifiedCount});
};

exports.bulkArchiveAgencies=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;const ids=Array.isArray(req.body?.ids)?[...new Set(req.body.ids.filter(validId).map(String))].slice(0,200):[],reason=text(req.body?.reason);if(!ids.length)return res.status(400).json({message:'Select at least one agency.'});if(reason.length<3)return res.status(400).json({message:'Archive reason is required.'});const agencies=await Organization.find({_id:{$in:ids},type:'AGENCY',parentOrganization:c._id}).lean();if(agencies.length!==ids.length)return res.status(403).json({message:'One or more selected agencies are unavailable.'});const activePackages=await WorkPackage.countDocuments({companyId:c._id,agencyId:{$in:ids},status:{$nin:['COMPLETED','CLOSED']}});if(activePackages)return res.status(409).json({message:`Selected agencies have ${activePackages} active work package(s). Reassign or close them first.`});await Organization.updateMany({_id:{$in:ids},type:'AGENCY',parentOrganization:c._id},{$set:{status:'ARCHIVED'}});await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'AGENCY_BULK_ARCHIVED',entityType:'Organization',before:{items:agencies.map(x=>({_id:x._id,name:x.name,status:x.status}))},after:{ids,reason,count:ids.length},bulkOperationId:crypto.randomUUID()});res.json({archived:ids.length});
};

exports.listBeneficiaries=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;
 const page=Math.max(1,Number(req.query.page||1)),pageSize=Math.min(100,Math.max(10,Number(req.query.pageSize||50)));
 const q=text(req.query.q),status=text(req.query.status),survey=text(req.query.survey),district=text(req.query.district),taluka=text(req.query.taluka),village=text(req.query.village),scheme=text(req.query.scheme),state=text(req.query.state);
 const ctxFilter={companyId:c._id};
 for(const [key,value] of [['programId',req.query.programId],['workOrderId',req.query.workOrderId],['workPackageId',req.query.workPackageId],['agencyId',req.query.agencyId]])if(value&&validId(value))ctxFilter[key]=value;
 if(req.query.contractId&&validId(req.query.contractId)){
  const ids=(await WorkOrder.find({companyId:c._id,contractId:req.query.contractId}).select('_id').lean()).map(x=>x._id);
  if(ctxFilter.workOrderId&&!ids.some(id=>String(id)===String(ctxFilter.workOrderId)))return res.json({items:[],total:0,page,pageSize,pages:1});
  if(!ctxFilter.workOrderId)ctxFilter.workOrderId={$in:ids};
 }
 if(state){
  const pkgFilter={companyId:c._id,'geography.state':state};
  if(ctxFilter.programId)pkgFilter.programId=ctxFilter.programId;if(ctxFilter.agencyId)pkgFilter.agencyId=ctxFilter.agencyId;
  const packageIds=(await WorkPackage.find(pkgFilter).select('_id').lean()).map(x=>x._id);
  if(ctxFilter.workPackageId&&!packageIds.some(id=>String(id)===String(ctxFilter.workPackageId)))return res.json({items:[],total:0,page,pageSize,pages:1});
  if(!ctxFilter.workPackageId)ctxFilter.workPackageId={$in:packageIds};
 }
 if(q||status||district||taluka||village||survey||scheme){
  const farmerFilter={};if(status)farmerFilter.applicationStatus=status;if(district)farmerFilter.district=district;if(taluka)farmerFilter.taluka=taluka;if(village)farmerFilter.village=village;if(survey)farmerFilter.inspectionStatus=survey;if(scheme)farmerFilter.scheme=scheme;
  if(q){const rx=safeRegex(q);farmerFilter.$or=[{beneficiaryId:rx},{beneficiaryName:rx},{mobile:rx},{alternateMobileNumber:rx},{village:rx},{taluka:rx},{district:rx},{divisionName:rx},{circleName:rx},{zoneName:rx},{scheme:rx},{assignedVendorCompanyName:rx},{installedByTechnicianName:rx}];}
  const farmers=await Farmer.find(farmerFilter).select('_id').limit(10000).lean();ctxFilter.farmerId={$in:farmers.map(x=>x._id)};
 }
 const [total,items]=await Promise.all([
  BeneficiaryContext.countDocuments(ctxFilter),
  BeneficiaryContext.find(ctxFilter).select('farmerId companyId programId workOrderId workPackageId agencyId assignedAt validationStatus').populate('farmerId').populate('agencyId','name code state contact').populate('programId','name code scheme financialYear').populate({path:'workOrderId',select:'number title status contractId',populate:{path:'contractId',select:'number title type'}}).populate('workPackageId','code name status geography').sort({updatedAt:-1}).skip((page-1)*pageSize).limit(pageSize).lean()
 ]);
 res.json({items,total,page,pageSize,pages:Math.max(1,Math.ceil(total/pageSize))});
};

exports.bulkUpdateBeneficiaries=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;
 const ids=Array.isArray(req.body.ids)?[...new Set(req.body.ids.filter(validId).map(String))].slice(0,500):[];
 if(!ids.length)return res.status(400).json({message:'Select at least one beneficiary.'});
 const patch={};
 if(req.body.applicationStatus!==undefined)patch.applicationStatus=text(req.body.applicationStatus);
 if(req.body.inspectionStatus!==undefined)patch.inspectionStatus=text(req.body.inspectionStatus);
 if(req.body.remarks!==undefined)patch.remarks=text(req.body.remarks);
 if(!Object.keys(patch).length)return res.status(400).json({message:'No supported update fields were supplied.'});
 const allowedFarmerIds=(await BeneficiaryContext.find({companyId:c._id,farmerId:{$in:ids}}).select('farmerId').lean()).map(x=>x.farmerId);
 const result=await Farmer.updateMany({_id:{$in:allowedFarmerIds}},{$set:patch},{runValidators:true});
 await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'BENEFICIARY_BULK_UPDATED',entityType:'Farmer',after:{ids:allowedFarmerIds.map(String),patch,count:result.modifiedCount},bulkOperationId:crypto.randomUUID()});
 res.json({matched:result.matchedCount,modified:result.modifiedCount});
};

exports.getBeneficiaryDetail=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;
 if(!mongoose.isValidObjectId(req.params.farmerId)) return res.status(400).json({message:'Invalid beneficiary/farmer id.'});
 const ctx=await BeneficiaryContext.findOne({companyId:c._id,farmerId:req.params.farmerId}).populate('farmerId').populate('companyId','name code').populate('agencyId','name code contact address').populate('programId','name code authority scheme component financialYear').populate({path:'workOrderId',select:'number title status dueDate contractId',populate:{path:'contractId',select:'number title type'}}).populate('workPackageId','code name status dueDate geography').populate('sourceImportBatchId','sourceFileName status totalRows successRows failedRows createdAt').lean();
 if(!ctx)return res.status(404).json({message:'Beneficiary not found in this company.'});
 const farmerId=ctx.farmerId?._id||ctx.farmerId;
 const [assets,materialIssues,serviceCases,compliance,evidenceRequirements,evidenceSubmissions]=await Promise.all([
  InstalledAsset.find({companyId:c._id,farmerId})
   .populate('itemId','sku name category installationRole unit brand manufacturer model')
   .populate('inventorySerialId','serialNumber barcodeValue status metadata')
   .populate('technicianUserId','username mobile')
   .sort({installedAt:-1})
   .lean(),
  MaterialIssue.find({companyId:c._id,farmerId})
   .populate('technicianUserId','username mobile')
   .populate('items.itemId','sku name category installationRole unit')
   .populate('items.serialIds','serialNumber barcodeValue status metadata')
   .sort({issuedAt:-1})
   .lean(),
  ServiceCase.find({companyId:c._id,farmerId}).sort({openedAt:-1}).lean(),
  ComplianceRecord.find({companyId:c._id,farmerId}).sort({createdAt:-1}).lean(),
  EvidenceRequirement.find({companyId:c._id,isActive:true,$or:[{programId:null},{programId:ctx.programId?._id||ctx.programId}]}).sort({stage:1,sortOrder:1}).lean(),
  EvidenceSubmission.find({companyId:c._id,farmerId}).populate('requirementId','key label stage evidenceType').populate('agencyId','name code').populate('submittedByLegacyUser','username mobile role').populate('submittedByPlatformUser','name email role').sort({updatedAt:-1}).lean()
 ]);
 const submissionByRequirement=new Map(evidenceSubmissions.map(x=>[String(x.requirementId?._id||x.requirementId),x]));
 const evidenceChecklist=evidenceRequirements.map(r=>({requirement:r,submission:submissionByRequirement.get(String(r._id))||null}));
 const shipments=ctx.workPackageId?await Shipment.find({companyId:c._id,workPackageId:ctx.workPackageId._id||ctx.workPackageId}).populate('agencyId','name code').populate('fromWarehouseId','name code').populate('toWarehouseId','name code').populate('items.itemId','sku name category installationRole unit').populate('items.serialIds','serialNumber barcodeValue status').sort({createdAt:-1}).lean():[];
 const reconciliation=await materialReconciliation({companyId:c._id,farmerId});
 res.json({
  context:ctx,farmer:ctx.farmerId,assets,materialIssues,serviceCases,compliance,evidenceChecklist,evidenceSubmissions,shipments,materialReconciliation:reconciliation,
  lineage:{
   source:{type:ctx.sourceImportBatchId?'IMPORT':'MANUAL',batch:ctx.sourceImportBatchId||null,row:ctx.sourceRowNumber||null,authority:ctx.sourceAuthority||null},
   assignment:{assignedAt:ctx.assignedAt||ctx.createdAt,history:ctx.assignmentHistory||[],agency:ctx.agencyId||null},
   delivery:{program:ctx.programId||null,contract:ctx.workOrderId?.contractId||null,workOrder:ctx.workOrderId||null,workPackage:ctx.workPackageId||null},
   survey:{surveyorName:ctx.farmerId?.surveyorName||null,surveyorMobile:ctx.farmerId?.surveyorMobile||null,surveyDate:ctx.farmerId?.surveyDate||null,status:ctx.farmerId?.inspectionStatus||null}
  }
 });
};
