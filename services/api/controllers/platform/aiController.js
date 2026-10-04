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
const ImportBatch=require('../../models/platform/ImportBatch');
const GoodsReceipt=require('../../models/platform/GoodsReceipt');
const Warehouse=require('../../models/platform/Warehouse');
const ItemMaster=require('../../models/platform/ItemMaster');
const StockMovement=require('../../models/platform/StockMovement');
const InventorySerial=require('../../models/platform/InventorySerial');
const MaterialIssue=require('../../models/platform/MaterialIssue');
const PDIRecord=require('../../models/platform/PDIRecord');
const InstalledAsset=require('../../models/platform/InstalledAsset');
const AssetLifecycleEvent=require('../../models/platform/AssetLifecycleEvent');
const AssetServicePlan=require('../../models/platform/AssetServicePlan');
const InsurancePolicy=require('../../models/platform/InsurancePolicy');
const SLARule=require('../../models/platform/SLARule');
const ComplianceRecord=require('../../models/platform/ComplianceRecord');
const ApprovalRequest=require('../../models/platform/ApprovalRequest');
const EvidenceRequirement=require('../../models/platform/EvidenceRequirement');
const EvidenceSubmission=require('../../models/platform/EvidenceSubmission');
const DocumentRecord=require('../../models/platform/DocumentRecord');
const AuditLog=require('../../models/platform/AuditLog');
const AutomationRun=require('../../models/platform/AutomationRun');
const MasterDataEntry=require('../../models/platform/MasterDataEntry');
const PlatformUser=require('../../models/platform/PlatformUser');
const RmsDevice=require('../../models/platform/RmsDevice');
const RmsCurrentState=require('../../models/platform/RmsCurrentState');
const RmsAlert=require('../../models/platform/RmsAlert');
const RmsProvider=require('../../models/platform/RmsProvider');
const platformAudit=require('../../utils/platformAudit');
const ai=require('../../utils/aiAdvisor');
const automationEngine=require('../../utils/automationEngine');
const {hasCapability}=require('../../security/platformCapabilities');

const companyIdFor=req=>req.platformUser.role==='platform_superadmin'?(req.query.companyId||req.body.companyId):String(req.tenant.companyId||'');
async function ensureCompany(req,res){const id=companyIdFor(req);if(!id||!mongoose.isValidObjectId(id)){res.status(400).json({message:'Valid company context is required.'});return null;}const c=await Organization.findOne({_id:id,type:'COMPANY',status:{$ne:'ARCHIVED'}}).select('name code status').lean();if(!c){res.status(404).json({message:'Company not found.'});return null;}return c;}
const groupToObject=rows=>Object.fromEntries((rows||[]).map(x=>[String(x._id??'UNKNOWN'),Number(x.count||0)]));
const grouped=async(Model,cid,field='status',extra={})=>groupToObject(await Model.aggregate([{$match:{companyId:cid,...extra}},{$group:{_id:`$${field}`,count:{$sum:1}}}]));
const count=async(Model,cid,extra={})=>Model.countDocuments({companyId:cid,...extra});

const PAGE_SCOPE={
 'company-overview':'EXECUTIVE','my-workspace':'EXECUTIVE','ai-operations':'EXECUTIVE','action-center':'EXECUTIVE','analytics':'EXECUTIVE','bulk-center':'EXECUTIVE','readiness':'EXECUTIVE',
 programs:'DELIVERY',contracts:'DELIVERY','work-orders':'DELIVERY','work-packages':'DELIVERY',agencies:'DELIVERY','beneficiary-records':'DELIVERY','geo-operations':'DELIVERY','beneficiary-imports':'DELIVERY','agency-performance':'DELIVERY',
 'supply-chain':'SUPPLY',procurement:'SUPPLY',stock:'SUPPLY',shipments:'SUPPLY',fleet:'SUPPLY','inventory-overview':'SUPPLY','item-master':'SUPPLY',warehouses:'SUPPLY','procurement-intelligence':'SUPPLY','logistics-overview':'SUPPLY','material-issues':'SUPPLY','agency-stock':'SUPPLY',pdi:'SUPPLY',
 'service-cases':'SERVICE','service-plans':'SERVICE','installed-assets':'SERVICE','asset-lifecycle':'SERVICE',reconciliation:'SERVICE',insurance:'SERVICE',compliance:'SERVICE','evidence-control':'SERVICE',sla:'SERVICE','rms-overview':'SERVICE','rms-live-assets':'SERVICE','rms-alerts':'SERVICE','rms-health':'SERVICE','rms-performance':'SERVICE','rms-map':'SERVICE','rms-commissioning':'SERVICE','rms-mapping':'SERVICE','rms-integrations':'SERVICE',
 'financial-control':'FINANCE',claims:'FINANCE','regulatory-reports':'FINANCE',
 'approval-center':'EXECUTIVE',notifications:'EXECUTIVE',documents:'EXECUTIVE',audit:'EXECUTIVE','team-access':'EXECUTIVE',automation:'EXECUTIVE','master-data':'EXECUTIVE'
};

const PAGE_CAPABILITY={
 'company-overview':'overview.read','my-workspace':'overview.read','ai-operations':'ai.read','action-center':'operations.read','analytics':'overview.read','bulk-center':'governance.write','readiness':'readiness.read',
 programs:'operations.read',contracts:'operations.read','work-orders':'operations.read','work-packages':'operations.read',agencies:'operations.read','beneficiary-records':'beneficiary.read','geo-operations':'beneficiary.read','beneficiary-imports':'operations.write','agency-performance':'operations.read',
 'supply-chain':['inventory.read','procurement.read','logistics.read'],procurement:'procurement.read',stock:'inventory.read',shipments:'logistics.read',fleet:'logistics.read','inventory-overview':'inventory.read','item-master':'inventory.read',warehouses:'inventory.read','procurement-intelligence':'procurement.read','logistics-overview':'logistics.read','material-issues':'logistics.read','agency-stock':'logistics.read',pdi:'pdi.read',
 'service-cases':'service.read','service-plans':'service.read','installed-assets':'assets.read','asset-lifecycle':'assets.read',reconciliation:['inventory.read','assurance.read','logistics.read'],insurance:'insurance.read',compliance:'assurance.read','evidence-control':'assurance.read',sla:'assurance.read','rms-overview':'rms.read','rms-live-assets':'rms.read','rms-alerts':'rms.read','rms-health':'rms.read','rms-performance':'rms.read','rms-map':'rms.read','rms-commissioning':'rms.read','rms-mapping':'rms.manage','rms-integrations':'rms.manage',
 'financial-control':'finance.read',claims:'finance.read','regulatory-reports':'regulatory.read','approval-center':'operations.read',notifications:'overview.read',documents:'overview.read',audit:'audit.read','team-access':'team.read',automation:'automation.read','master-data':'governance.write'
};
const canUsePage=(role,page)=>{const need=PAGE_CAPABILITY[page]||'overview.read',list=Array.isArray(need)?need:[need];return Boolean(PAGE_SCOPE[page]&&list.some(cap=>hasCapability(role,cap)));};
const INTENT_ROUTES=[
 [/(rms|telemetry|device|pump|motor|panel|controller|inverter|offline|stale|dry run|fault|energy|runtime|water discharge)/i,'rms-overview'],
 [/(claim|receivable|paid|payment|blocked amount|financial|finance|commercial|working capital)/i,'financial-control'],
 [/(purchase order|\bpo\b|procurement|supplier|\bgrn\b|goods receipt)/i,'procurement'],
 [/(stock|inventory|serial|barcode|warehouse|sku|item master|material custody)/i,'stock'],
 [/(shipment|dispatch|driver|vehicle|fleet|delivery tracking)/i,'shipments'],
 [/(service|warranty|amc|complaint|breakdown|repair)/i,'service-cases'],
 [/(compliance|inspection|quality|evidence|claim ready)/i,'compliance'],
 [/(agency performance|agency ranking|agency score)/i,'agency-performance'],
 [/(beneficiar|farmer|survey|installation status|application status)/i,'beneficiary-records'],
 [/(program|work order|work package|loa|contract|delivery portfolio)/i,'programs'],
 [/(approval|waiver|decision pending)/i,'approval-center'],
 [/(notification|alert center)/i,'notifications'],
 [/(audit|who changed|changed by|history of change)/i,'audit']
];
const contextPageFor=(question,currentPage,role)=>{for(const[re,target]of INTENT_ROUTES)if(re.test(String(question||''))&&canUsePage(role,target))return target;return canUsePage(role,currentPage)?currentPage:'company-overview'};

const SAFE_ACTIONS={
 programs:[['programs','Open delivery portfolio'],['work-packages','Open work packages'],['beneficiary-records','Open beneficiaries']],contracts:[['programs','Open delivery portfolio'],['work-orders','Open work orders']], 'work-orders':[['work-orders','Open work orders'],['work-packages','Open work packages']], 'work-packages':[['work-packages','Open work packages'],['agencies','Open agencies']],
 agencies:[['agencies','Open agencies'],['work-packages','Open work packages'],['agency-performance','Open agency performance']], 'beneficiary-records':[['beneficiary-records','Open beneficiaries'],['geo-operations','Open geo operations'],['service-cases','Open service cases']], 'geo-operations':[['geo-operations','Open geo operations'],['beneficiary-records','Open beneficiaries']], 'beneficiary-imports':[['beneficiary-imports','Open imports'],['beneficiary-records','Open beneficiaries']],
 'supply-chain':[['supply-chain','Open supply control'],['procurement','Open procurement'],['shipments','Open dispatch']],procurement:[['procurement','Open procurement'],['stock','Open stock']],stock:[['stock','Open warehouse stock'],['warehouses','Open warehouses']],shipments:[['shipments','Open dispatch tracking'],['fleet','Open fleet']],fleet:[['fleet','Open fleet'],['shipments','Open dispatch tracking']], 'item-master':[['item-master','Open item master'],['stock','Open stock']],warehouses:[['warehouses','Open warehouses'],['stock','Open stock']], 'material-issues':[['material-issues','Open material custody'],['agency-stock','Open agency stock']], 'agency-stock':[['agency-stock','Open agency stock'],['shipments','Open dispatch']],pdi:[['pdi','Open PDI'],['stock','Open stock']],
 'installed-assets':[['installed-assets','Open installed assets'],['asset-lifecycle','Open lifecycle']], 'asset-lifecycle':[['asset-lifecycle','Open lifecycle'],['installed-assets','Open assets']], 'service-cases':[['service-cases','Open service cases'],['installed-assets','Open assets']], 'service-plans':[['service-plans','Open warranty & AMC'],['installed-assets','Open assets']],insurance:[['insurance','Open insurance'],['installed-assets','Open assets']],compliance:[['compliance','Open compliance'],['evidence-control','Open evidence']], 'evidence-control':[['evidence-control','Open evidence control'],['compliance','Open compliance']],sla:[['sla','Open SLA rules'],['service-cases','Open service cases']],
 'rms-overview':[['rms-overview','Open RMS monitoring'],['rms-alerts','Open RMS alerts'],['rms-live-assets','Open live RMS assets']], 'rms-live-assets':[['rms-live-assets','Open live RMS assets'],['rms-alerts','Open RMS alerts']], 'rms-alerts':[['rms-alerts','Open RMS alerts'],['service-cases','Open service cases'],['rms-live-assets','Open live RMS assets']], 'rms-health':[['rms-health','Open RMS health'],['rms-alerts','Open RMS alerts']], 'rms-performance':[['rms-performance','Open RMS performance'],['rms-live-assets','Open live RMS assets']], 'rms-map':[['rms-map','Open RMS map'],['rms-live-assets','Open live RMS assets']], 'rms-commissioning':[['rms-commissioning','Open RMS commissioning'],['rms-mapping','Open RMS mapping']], 'rms-mapping':[['rms-mapping','Open RMS mapping'],['rms-commissioning','Open RMS commissioning']], 'rms-integrations':[['rms-integrations','Open RMS integrations'],['rms-health','Open RMS health']],
 claims:[['claims','Open claims'],['financial-control','Open financial control']], 'financial-control':[['financial-control','Open financial control'],['claims','Open claims']], 'approval-center':[['approval-center','Open approvals'],['notifications','Open notifications']],notifications:[['notifications','Open notifications']],documents:[['documents','Open documents']],audit:[['audit','Open audit trail']], 'team-access':[['team-access','Open team & access']],automation:[['automation','Open automation']], 'master-data':[['master-data','Open master data']],readiness:[['readiness','Open readiness'],['company-overview','Open dashboard']],analytics:[['analytics','Open analytics'],['company-overview','Open dashboard']], 'company-overview':[['company-overview','Open dashboard'],['notifications','Open notifications'],['ai-operations','Open intelligence']]
};
const actionsFor=(page,question='',role='')=>{
 const intent=contextPageFor(question,page,role);const candidates=[];
 const push=(target,label)=>{if(canUsePage(role,target)&&!candidates.some(x=>x.target===target))candidates.push({target,label})};
 for(const[target,label]of SAFE_ACTIONS[intent]||[])push(target,label);
 if(intent!==page)for(const[target,label]of SAFE_ACTIONS[page]||[])push(target,label);
 return candidates.slice(0,4);
};

function restrictedQuestion(question){
 const q=String(question||'').trim().toLowerCase();
 if(!q)return 'Please ask a question about this Company workspace.';
 if(q.length>1200)return 'Question is too long. Ask one Company operations question at a time.';
 const blocked=/\b(other company|another company|other tenant|another tenant|system prompt|developer message|source code|database schema|db schema|api key|password|credential|secret|token|jwt|ignore previous|bypass|jailbreak)\b/i;
 if(blocked.test(q))return 'I can only answer from the current Company operational context and cannot expose other tenants, credentials, prompts, source internals, or creator metadata.';
 const business=/\b(program|contract|work order|work package|agency|agencies|beneficiar|farmer|survey|installation|complaint|delivery|dispatch|shipment|fleet|driver|vehicle|warehouse|stock|inventory|item|material|procurement|purchase|po\b|grn|pdi|asset|service|warranty|amc|insurance|sla|claim|receivable|finance|compliance|approval|evidence|notification|document|audit|team|user|access|automation|master data|readiness|analytics|operations|rms|telemetry|pump|controller|device|connectivity|offline|stale|fault|commissioning|mapping|company|dashboard|status|risk|attention|priority|pending|overdue|open|closed|today|current|this screen|here|why|what needs|brief|summary|summarize|show|list|explain|how many|count)\b/i;
 return business.test(q)?'':'I can answer only questions about this Company, its OPSYNQ modules, and the operational data available to your role.';
}

async function buildDeliveryFacts(cid,page){
 if(page==='agencies')return{agencies:{byStatus:groupToObject(await Organization.aggregate([{$match:{parentOrganization:cid,type:'AGENCY'}},{$group:{_id:'$status',count:{$sum:1}}}])),total:await Organization.countDocuments({parentOrganization:cid,type:'AGENCY'})},workPackages:{byStatus:await grouped(WorkPackage,cid)}};
 if(page==='beneficiary-records'||page==='geo-operations')return{beneficiaries:{total:await count(BeneficiaryContext,cid),executionByStatus:groupToObject(await BeneficiaryContext.aggregate([{$match:{companyId:cid}},{$lookup:{from:'farmers',localField:'farmerId',foreignField:'_id',as:'farmer'}},{$unwind:{path:'$farmer',preserveNullAndEmptyArrays:true}},{$group:{_id:{$ifNull:['$farmer.applicationStatus','UNKNOWN']},count:{$sum:1}}}]))},workPackages:{byStatus:await grouped(WorkPackage,cid)}};
 if(page==='beneficiary-imports')return{imports:{byStatus:await grouped(ImportBatch,cid),total:await count(ImportBatch,cid)},beneficiaries:{total:await count(BeneficiaryContext,cid)}};
 return{programs:{total:await count(Program,cid),byStatus:await grouped(Program,cid)},contracts:{total:await count(Contract,cid),byStatus:await grouped(Contract,cid)},workOrders:{total:await count(WorkOrder,cid),byStatus:await grouped(WorkOrder,cid)},workPackages:{total:await count(WorkPackage,cid),byStatus:await grouped(WorkPackage,cid)}};
}
async function buildSupplyFacts(cid,page){
 if(page==='procurement'||page==='procurement-intelligence')return{purchaseOrders:{byStatus:await grouped(PurchaseOrder,cid),total:await count(PurchaseOrder,cid)},goodsReceipts:{total:await count(GoodsReceipt,cid)}};
 if(page==='stock'||page==='inventory-overview'||page==='reconciliation')return{inventory:{balances:await InventoryBalance.aggregate([{$match:{companyId:cid}},{$group:{_id:null,onHand:{$sum:{$ifNull:['$onHand',0]}},allocated:{$sum:{$ifNull:['$allocated',0]}},inTransit:{$sum:{$ifNull:['$inTransit',0]}}}}]).then(x=>x[0]||{onHand:0,allocated:0,inTransit:0}),serialsByStatus:await grouped(InventorySerial,cid),movements:await count(StockMovement,cid)}};
 if(page==='item-master')return{items:{total:await count(ItemMaster,cid),active:await count(ItemMaster,cid,{isActive:true})}};
 if(page==='warehouses')return{warehouses:{total:await count(Warehouse,cid),active:await count(Warehouse,cid,{isActive:true})},inventory:{balances:await count(InventoryBalance,cid)}};
 if(page==='shipments'||page==='logistics-overview')return{shipments:{byStatus:await grouped(Shipment,cid),overdue:await Shipment.countDocuments({companyId:cid,status:{$in:['DISPATCHED','IN_TRANSIT','PARTIAL']},eta:{$lt:new Date()}})}};
 if(page==='fleet')return{drivers:{byStatus:await grouped(Driver,cid)},vehicles:{byStatus:await grouped(Vehicle,cid)}};
 if(page==='material-issues'||page==='agency-stock')return{materialIssues:{byStatus:await grouped(MaterialIssue,cid),total:await count(MaterialIssue,cid)},shipments:{byStatus:await grouped(Shipment,cid)}};
 if(page==='pdi')return{pdi:{byResult:await grouped(PDIRecord,cid,'result'),byDisposition:await grouped(PDIRecord,cid,'disposition'),total:await count(PDIRecord,cid)}};
 return{purchaseOrders:{byStatus:await grouped(PurchaseOrder,cid)},inventory:{balances:await InventoryBalance.aggregate([{$match:{companyId:cid}},{$group:{_id:null,onHand:{$sum:{$ifNull:['$onHand',0]}},allocated:{$sum:{$ifNull:['$allocated',0]}},inTransit:{$sum:{$ifNull:['$inTransit',0]}}}}]).then(x=>x[0]||{})},shipments:{byStatus:await grouped(Shipment,cid)}};
}
async function buildRmsFacts(cid,page){
 const [deviceByMapping,deviceByCommissioning,stateByHealth,stateByCommunication,alertBySeverity,alertByStatus,providers,activeAlerts,openIncidents,totalDevices]=await Promise.all([
  grouped(RmsDevice,cid,'mappingStatus'),grouped(RmsDevice,cid,'commissioningStatus'),grouped(RmsCurrentState,cid,'health'),grouped(RmsCurrentState,cid,'communication'),grouped(RmsAlert,cid,'severity'),grouped(RmsAlert,cid,'status'),RmsProvider.find({companyId:cid}).select('name code type mode status lastDataReceived lastSuccessfulSync').lean(),RmsAlert.countDocuments({companyId:cid,status:'ACTIVE'}),ServiceCase.countDocuments({companyId:cid,status:{$in:['OPEN','ASSIGNED','IN_PROGRESS','WAITING_PART']},'metadata.rmsAlertId':{$exists:true}}),count(RmsDevice,cid)
 ]);
 const output=await RmsCurrentState.aggregate([{$match:{companyId:cid}},{$group:{_id:null,activePumps:{$sum:{$cond:[{$and:[{$eq:['$pumpState','RUNNING']},{$eq:['$communication','ONLINE']}]},1,0]}},energyTodayKwh:{$sum:{$ifNull:['$energyTodayKwh',0]}},runtimeTodayMinutes:{$sum:{$ifNull:['$runtimeTodayMinutes',0]}},waterDischargeLitres:{$sum:{$ifNull:['$waterDischargeLitres',0]}}}}]).then(x=>x[0]||{activePumps:0,energyTodayKwh:0,runtimeTodayMinutes:0,waterDischargeLitres:0});
 const recentCritical=await RmsAlert.find({companyId:cid,status:'ACTIVE',severity:'CRITICAL'}).sort({lastDetectedAt:-1}).limit(8).populate('deviceId','externalDeviceId').populate('farmerId','beneficiaryId beneficiaryName').populate('agencyId','name code').select('type severity status message lastDetectedAt deviceId farmerId agencyId relatedServiceCaseId').lean();
 return{rms:{devices:{total:totalDevices,byMapping:deviceByMapping,byCommissioning:deviceByCommissioning},state:{byHealth:stateByHealth,byCommunication:stateByCommunication,...output},alerts:{active:activeAlerts,bySeverity:alertBySeverity,byStatus:alertByStatus,recentCritical:recentCritical.map(x=>({type:x.type,message:x.message,lastDetectedAt:x.lastDetectedAt,device:x.deviceId?.externalDeviceId||null,beneficiary:x.farmerId?.beneficiaryName||x.farmerId?.beneficiaryId||null,agency:x.agencyId?.name||x.agencyId?.code||null,serviceCaseId:x.relatedServiceCaseId||null}))},openRmsServiceIncidents:openIncidents,providers:providers.map(x=>({name:x.name,code:x.code,type:x.type,mode:x.mode,status:x.status,lastDataReceived:x.lastDataReceived,lastSuccessfulSync:x.lastSuccessfulSync}))}};
}

async function buildServiceFacts(cid,page){
 if(String(page||'').startsWith('rms-'))return buildRmsFacts(cid,page);
 if(page==='installed-assets')return{assets:{byStatus:await grouped(InstalledAsset,cid),byRole:await grouped(InstalledAsset,cid,'assetRole'),total:await count(InstalledAsset,cid)}};
 if(page==='asset-lifecycle')return{lifecycle:{byEvent:await grouped(AssetLifecycleEvent,cid,'eventType'),total:await count(AssetLifecycleEvent,cid)},assets:{byStatus:await grouped(InstalledAsset,cid)}};
 if(page==='service-cases')return{serviceCases:{byStatus:await grouped(ServiceCase,cid),byPriority:await grouped(ServiceCase,cid,'priority'),total:await count(ServiceCase,cid)}};
 if(page==='service-plans')return{servicePlans:{byStatus:await grouped(AssetServicePlan,cid),byType:await grouped(AssetServicePlan,cid,'planType'),total:await count(AssetServicePlan,cid)}};
 if(page==='insurance')return{insurance:{byStatus:await grouped(InsurancePolicy,cid),byType:await grouped(InsurancePolicy,cid,'policyType'),total:await count(InsurancePolicy,cid)}};
 if(page==='compliance')return{compliance:{byStatus:await grouped(ComplianceRecord,cid),byType:await grouped(ComplianceRecord,cid,'type'),total:await count(ComplianceRecord,cid)}};
 if(page==='evidence-control')return{requirements:{total:await count(EvidenceRequirement,cid),active:await count(EvidenceRequirement,cid,{isActive:true})},submissions:{byStatus:await grouped(EvidenceSubmission,cid),byStage:await grouped(EvidenceSubmission,cid,'stage'),total:await count(EvidenceSubmission,cid)}};
 if(page==='sla')return{slaRules:{total:await count(SLARule,cid),active:await count(SLARule,cid,{isActive:true}),byTarget:await grouped(SLARule,cid,'appliesTo')},serviceCases:{byStatus:await grouped(ServiceCase,cid)}};
 return{serviceCases:{byStatus:await grouped(ServiceCase,cid)},assets:{byStatus:await grouped(InstalledAsset,cid)}};
}
async function buildFinanceFacts(cid,page){
 const claims={byStatus:await grouped(CommercialClaim,cid),total:await count(CommercialClaim,cid),approvedValue:await CommercialClaim.aggregate([{$match:{companyId:cid}},{$group:{_id:null,value:{$sum:{$ifNull:['$approvedAmount',0]}}}}]).then(x=>Number(x[0]?.value||0))};
 if(page==='claims')return{claims};
 return{claims,purchaseOrders:{byStatus:await grouped(PurchaseOrder,cid)}};
}
async function buildAdminFacts(cid,page){
 if(page==='approval-center')return{approvals:{byStatus:await grouped(ApprovalRequest,cid),byType:await grouped(ApprovalRequest,cid,'type'),total:await count(ApprovalRequest,cid)}};
 if(page==='notifications')return{notifications:{unread:await Notification.countDocuments({companyId:cid,readAt:null}),total:await count(Notification,cid)}};
 if(page==='documents')return{documents:{byStatus:await grouped(DocumentRecord,cid),byCategory:await grouped(DocumentRecord,cid,'category'),total:await count(DocumentRecord,cid)}};
 if(page==='audit')return{audit:{total:await count(AuditLog,cid),recent24h:await AuditLog.countDocuments({companyId:cid,createdAt:{$gte:new Date(Date.now()-86400000)}})}};
 if(page==='team-access')return{team:{total:await PlatformUser.countDocuments({organizationId:cid}),active:await PlatformUser.countDocuments({organizationId:cid,isActive:true}),byRole:groupToObject(await PlatformUser.aggregate([{$match:{organizationId:cid}},{$group:{_id:'$role',count:{$sum:1}}}]))}};
 if(page==='automation')return{automation:{byStatus:await grouped(AutomationRun,cid),recent24h:await AutomationRun.countDocuments({companyId:cid,startedAt:{$gte:new Date(Date.now()-86400000)}})}};
 if(page==='master-data')return{masterData:{total:await count(MasterDataEntry,cid),active:await count(MasterDataEntry,cid,{isActive:true}),byDomain:await grouped(MasterDataEntry,cid,'domain')}};
 const [delivery,supply,service,finance]=await Promise.all([buildDeliveryFacts(cid,'programs'),buildSupplyFacts(cid,'supply-chain'),buildServiceFacts(cid,'service-cases'),buildFinanceFacts(cid,'financial-control')]);
 return{delivery,supply,service,finance,attention:{unreadNotifications:await Notification.countDocuments({companyId:cid,readAt:null}),pendingApprovals:await ApprovalRequest.countDocuments({companyId:cid,status:'PENDING'})}};
}
async function buildScreenFacts(companyId,page){const cid=new mongoose.Types.ObjectId(String(companyId));const scope=PAGE_SCOPE[page]||'EXECUTIVE';let facts;if(scope==='DELIVERY')facts=await buildDeliveryFacts(cid,page);else if(scope==='SUPPLY')facts=await buildSupplyFacts(cid,page);else if(scope==='SERVICE')facts=await buildServiceFacts(cid,page);else if(scope==='FINANCE')facts=await buildFinanceFacts(cid,page);else facts=await buildAdminFacts(cid,page);return{generatedAt:new Date().toISOString(),page,scope,...facts};}

exports.status=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const result=await ai.health();res.json({...result,company:{id:c._id,name:c.name}})};
exports.brief=async(req,res)=>{
 const c=await ensureCompany(req,res);if(!c)return;
 const requestedPage=String(req.body.page||'company-overview').trim();if(!PAGE_SCOPE[requestedPage])return res.status(400).json({message:'Unsupported Company workspace screen.'});
 const role=String(req.platformUser?.role||'');
 if(!canUsePage(role,requestedPage))return res.status(403).json({message:'AI cannot access this module for your role.'});
 const question=String(req.body.question||'').trim();const restriction=restrictedQuestion(question);
 const contextPage=contextPageFor(question,requestedPage,role),scope=PAGE_SCOPE[contextPage];
 if(restriction){await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'AI_OPERATIONS_QUESTION_RESTRICTED',entityType:'Organization',entityId:c._id,after:{page:requestedPage,scope,reason:restriction.slice(0,180)}});return res.json({scope,page:requestedPage,contextPage,restricted:true,generatedAt:new Date(),brief:{answer:restriction,keyFacts:[],nextSteps:[],confidence:'HIGH',dataLimitations:[]},actions:actionsFor(contextPage,question,role)});}
 const facts=await buildScreenFacts(c._id,contextPage);
 const common={scope,page:requestedPage,contextPage,actions:actionsFor(contextPage,question,role),factsAsOf:facts.generatedAt,role};
 if(!ai.enabled()){
  const fallback=ai.fallbackOperationsBrief({pageLabel:String(req.body.pageLabel||contextPage).slice(0,100),question,facts});
  await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'AI_OPERATIONS_PROVIDER_FALLBACK',entityType:'Organization',entityId:c._id,after:{scope,page:requestedPage,contextPage,providerCode:'NOT_CONFIGURED'}});
  return res.json({...common,generatedAt:new Date(),brief:fallback,provider:{ready:false,code:'NOT_CONFIGURED',message:'Live AI is not configured; tenant-scoped deterministic guidance shown.'}});
 }
 try{
  const brief=await ai.operationsBrief({scope,page:contextPage,pageLabel:String(req.body.pageLabel||contextPage).slice(0,100),question,facts,role});
  if(!brief)return res.status(502).json({message:'Operations intelligence returned no usable response.'});
  await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'AI_OPERATIONS_BRIEF_GENERATED',entityType:'Organization',entityId:c._id,after:{scope,page:requestedPage,contextPage,model:ai.MODEL(),question:question.slice(0,240)}});
  res.json({...common,generatedAt:new Date(),brief});
 }catch(error){
  const code=error?.code||'PROVIDER_ERROR';
  if(['INVALID_CREDENTIAL','RATE_LIMITED','PROVIDER_UNAVAILABLE','NETWORK_ERROR','TIMEOUT'].includes(code)){
   const fallback=ai.fallbackOperationsBrief({pageLabel:String(req.body.pageLabel||contextPage).slice(0,100),question,facts});
   await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'AI_OPERATIONS_PROVIDER_FALLBACK',entityType:'Organization',entityId:c._id,after:{scope,page:requestedPage,contextPage,providerCode:code}});
   return res.json({...common,generatedAt:new Date(),brief:fallback,provider:{ready:false,code,message:code==='INVALID_CREDENTIAL'?'AI provider credential rejected; replace the server-side credential.':'AI provider temporarily unavailable; tenant-scoped deterministic guidance shown.'}});
  }
  res.status(502).json({message:'Operations intelligence request failed.',code,detail:String(error.message||error).slice(0,300)});
 }
};

exports.scan=async(req,res)=>{const c=await ensureCompany(req,res);if(!c)return;const jobs=['service_sla','claim_sla','warranty','insurance','replenishment'];const results=[];for(const job of jobs){const run=await automationEngine.executeJob(job,{companyId:c._id,trigger:'INTELLIGENCE_SCAN',requestedBy:req.platformUser._id});results.push({job,status:run.status,metrics:run.metrics||{},errors:run.errors||[]});}await platformAudit(req,{companyId:c._id,organizationId:c._id,action:'OPERATIONS_INTELLIGENCE_SCAN',entityType:'Organization',entityId:c._id,after:{jobs:results.map(x=>({job:x.job,status:x.status}))}});res.json({completedAt:new Date(),results});};
