const AgencyUserLink=require('../models/platform/AgencyUserLink');
const BeneficiaryContext=require('../models/platform/BeneficiaryContext');
const {unscopedDemoAllowed}=require('./sessionCookies');

const SCOPE_TTL_MS=Math.max(5000,Number(process.env.AGENCY_SCOPE_CACHE_TTL_MS||30000));
const scopeCache=new Map();
const cacheKey=user=>String(user?._id||'');
const cloneScope=scope=>({...scope,agencyIds:[...(scope.agencyIds||[])],companyIds:[...(scope.companyIds||[])],farmerIds:[...(scope.farmerIds||[])]});

const technicianAssignmentFilter=(user={})=>({$or:[
 {surveyorMobile:String(user.mobile||'')},{surveyorName:String(user.username||'')},{jsrTechnician:String(user.username||'')},
 {installedByTechnicianName:String(user.username||'')},{installationAssignedTechnician:String(user.username||'')},{reworkAssignTechnician:String(user.username||'')},{confirmedBy:String(user.username||'')},{orderReceivedByTechnician:String(user.username||'')},
]});

async function resolveAgencyScope(user){
 if(!user?._id)return{linked:false,agencyIds:[],companyIds:[],farmerIds:[],demoUnscoped:false};
 const key=cacheKey(user),cached=scopeCache.get(key);
 if(cached&&Date.now()-cached.at<SCOPE_TTL_MS)return cloneScope(cached.scope);
 const links=await AgencyUserLink.find({legacyUserId:user._id,isActive:true}).select('agencyId companyId role').lean();
 let scope;
 if(!links.length)scope={linked:false,agencyIds:[],companyIds:[],farmerIds:[],demoUnscoped:unscopedDemoAllowed(user)};
 else{
  const agencyIds=[...new Set(links.map(x=>String(x.agencyId)).filter(Boolean))];
  const contexts=await BeneficiaryContext.find({agencyId:{$in:agencyIds}}).select('farmerId agencyId companyId').lean();
  scope={linked:true,agencyIds,companyIds:[...new Set(links.map(x=>String(x.companyId)).filter(Boolean))],farmerIds:[...new Set(contexts.map(x=>String(x.farmerId)).filter(Boolean))],demoUnscoped:false};
 }
 scopeCache.set(key,{at:Date.now(),scope});
 if(scopeCache.size>1000){const cutoff=Date.now()-SCOPE_TTL_MS;for(const [k,v] of scopeCache){if(v.at<cutoff)scopeCache.delete(k)}}
 return cloneScope(scope);
}

function clearAgencyScopeCache(userId){if(userId)scopeCache.delete(String(userId));else scopeCache.clear()}

async function farmerQueryForUser(user){
 const scope=await resolveAgencyScope(user);
 if(!scope.linked&&!scope.demoUnscoped)return{scope,query:{_id:{$in:[]}}};
 const clauses=[];
 if(scope.linked)clauses.push({_id:{$in:scope.farmerIds}});
 if(user?.role==='field_technician')clauses.push(technicianAssignmentFilter(user));
 return{scope,query:clauses.length===0?{}:clauses.length===1?clauses[0]:{$and:clauses}};
}

async function canAccessFarmer(user,farmer){
 if(!farmer||!user)return false;
 const {scope}=await farmerQueryForUser(user);
 if(!scope.linked&&!scope.demoUnscoped)return false;
 if(scope.linked&&!scope.farmerIds.includes(String(farmer._id)))return false;
 if(user.role!=='field_technician')return true;
 const username=String(user.username||''),mobile=String(user.mobile||'');
 return [String(farmer.surveyorMobile||'')===mobile,String(farmer.surveyorName||'')===username,String(farmer.jsrTechnician||'')===username,String(farmer.installedByTechnicianName||'')===username,String(farmer.installationAssignedTechnician||'')===username,String(farmer.reworkAssignTechnician||'')===username,String(farmer.confirmedBy||'')===username,String(farmer.orderReceivedByTechnician||'')===username].some(Boolean);
}
module.exports={resolveAgencyScope,farmerQueryForUser,canAccessFarmer,technicianAssignmentFilter,clearAgencyScopeCache};
