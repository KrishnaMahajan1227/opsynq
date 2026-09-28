const Organization=require('../../models/platform/Organization');
const WorkOrder=require('../../models/platform/WorkOrder');
const WorkPackage=require('../../models/platform/WorkPackage');
const Shipment=require('../../models/platform/Shipment');
const InventorySerial=require('../../models/platform/InventorySerial');
const CommercialClaim=require('../../models/platform/CommercialClaim');
const ServiceCase=require('../../models/platform/ServiceCase');
const BeneficiaryContext=require('../../models/platform/BeneficiaryContext');
const Farmer=require('../../models/Farmer');


const ROLE_SEARCH_PAGES={
 company_owner:null,company_admin:null,
 operations_manager:new Set(['work-orders','work-packages','agencies','beneficiary-records','shipments','service-cases']),
 program_manager:new Set(['work-orders','work-packages','agencies','beneficiary-records','claims']),
 inventory_manager:new Set(['shipments','scanner']),
 procurement_manager:new Set([]),
 finance_user:new Set(['claims']),
 quality_user:new Set(['beneficiary-records','service-cases']),
 logistics_manager:new Set(['shipments','scanner']),
 viewer:new Set([])
};
const allowedForRole=(role,page)=>{const set=ROLE_SEARCH_PAGES[role];return set===null||role==='platform_superadmin'||Boolean(set?.has(page));};

const esc=s=>String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pickCompany=(req)=>{
 if(req.platformUser?.role==='platform_superadmin') return req.query.companyId||null;
 return req.tenant?.companyId||null;
};
const hit=(type,page,id,title,subtitle='')=>({type,page,id:String(id),title:String(title||''),subtitle:String(subtitle||'')});

exports.search=async(req,res)=>{
 try{
  const q=String(req.query.q||'').trim();
  if(q.length<2)return res.json({results:[]});
  const companyId=pickCompany(req);
  const rx=new RegExp(esc(q),'i');
  if(!companyId&&req.platformUser?.role==='platform_superadmin'){
   const companies=await Organization.find({type:'COMPANY',$or:[{name:rx},{code:rx},{'contact.email':rx},{'contact.mobile':rx},{country:rx},{state:rx}]}).limit(20).lean();
   return res.json({results:companies.map(x=>hit('Company','companies',x._id,x.name,`${x.code||''} · ${x.status||''}`))});
  }
  if(!companyId)return res.json({results:[]});
  const [workOrders,workPackages,shipments,serials,claims,cases,agencies]=await Promise.all([
   WorkOrder.find({companyId,$or:[{number:rx},{title:rx},{loaNumber:rx},{tenderNumber:rx}]}).limit(5).lean(),
   WorkPackage.find({companyId,$or:[{code:rx},{name:rx},{'geography.district':rx},{'geography.state':rx}]}).limit(5).lean(),
   Shipment.find({companyId,shipmentNo:rx}).limit(5).lean(),
   InventorySerial.find({companyId,$or:[{serialNumber:rx},{barcodeValue:rx},{batchNo:rx}]}).limit(5).lean(),
   CommercialClaim.find({companyId,$or:[{claimNo:rx},{title:rx},{blockedReason:rx}]}).limit(5).lean(),
   ServiceCase.find({companyId,$or:[{caseNo:rx},{title:rx},{description:rx}]}).limit(5).lean(),
   Organization.find({parentOrganization:companyId,type:'AGENCY',$or:[{name:rx},{code:rx},{'contact.email':rx},{'contact.mobile':rx}]}).limit(5).lean().catch(()=>[])
  ]);
  const farmers=await Farmer.find({$or:[{beneficiaryId:rx},{beneficiaryName:rx},{mobile:rx},{village:rx},{district:rx}]}).select('_id beneficiaryId beneficiaryName mobile village district').limit(12).lean();
  const contexts=farmers.length?await BeneficiaryContext.find({companyId,farmerId:{$in:farmers.map(f=>f._id)}}).select('farmerId').lean():[];
  const allowed=new Set(contexts.map(c=>String(c.farmerId)));
  const results=[
   ...workOrders.map(x=>hit('Work Order','work-orders',x._id,x.number,x.title||x.status)),
   ...workPackages.map(x=>hit('Work Package','work-packages',x._id,x.code,x.name||x.geography?.district||x.status)),
   ...agencies.map(x=>hit('Agency','agencies',x._id,x.name,x.code||x.status)),
   ...shipments.map(x=>hit('Shipment','shipments',x._id,x.shipmentNo,x.status)),
   ...serials.map(x=>hit('Serial','scanner',x._id,x.serialNumber,x.status)),
   ...claims.map(x=>hit('Claim','claims',x._id,x.claimNo,`${x.status} · ${x.title||''}`)),
   ...cases.map(x=>hit('Service','service-cases',x._id,x.caseNo,`${x.status} · ${x.title||''}`)),
   ...farmers.filter(f=>allowed.has(String(f._id))).slice(0,5).map(f=>hit('Beneficiary','beneficiary-records',f._id,f.beneficiaryName||f.beneficiaryId,`${f.beneficiaryId||''} ${f.mobile||''} ${f.village||f.district||''}`.trim()))
  ].filter(r=>allowedForRole(req.platformUser?.role,r.page)).slice(0,30);
  res.json({results});
 }catch(err){console.error('Platform search error',err);res.status(500).json({message:'Unable to search records.'});}
};
