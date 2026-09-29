const PlatformUser=require('../models/platform/PlatformUser');
const User=require('../models/User');
const Organization=require('../models/platform/Organization');
const {readSessionToken,decodeAndVerify}=require('../utils/sessionCookies');
const {resolveAgencyScope,farmerQueryForUser}=require('../utils/agencyScope');
const Farmer=require('../models/Farmer');
const {hasCapability}=require('../security/platformCapabilities');

exports.protectRms=async(req,res,next)=>{
 for(const realm of ['platform','agency']){
  const token=readSessionToken(req,realm);if(!token)continue;
  try{
   const decoded=decodeAndVerify(token);if(decoded.scope!==realm)continue;
   if(realm==='platform'){
    const user=await PlatformUser.findById(decoded.id).select('-password').populate('organizationId','type status name code');
    if(!user||!user.isActive||user.approvalStatus!=='APPROVED'||Number(decoded.tv||0)!==Number(user.tokenVersion||0))continue;
    let companyId=user.organizationId?.type==='COMPANY'?user.organizationId._id:null;
    if(user.role==='platform_superadmin'&&req.query.companyId){const company=await Organization.findOne({_id:req.query.companyId,type:'COMPANY',status:{$ne:'ARCHIVED'}}).select('_id').lean();if(!company)return res.status(404).json({message:'Company not found.'});companyId=company._id;}
    if(!companyId)return res.status(403).json({message:'Company scope required.'});
    if(user.role!=='platform_superadmin'&&!hasCapability(user.role,'rms.read'))return res.status(403).json({message:'RMS access is not permitted for this role.'});
    req.rmsAuth={realm,user,companyIds:[String(companyId)],agencyIds:[],farmerIds:[],canManage:user.role==='platform_superadmin'||hasCapability(user.role,'rms.manage')};
    return next();
   }
   const user=await User.findById(decoded.id).select('-password');
   if(!user||user.isActive===false||Number(decoded.tv||0)!==Number(user.tokenVersion||0))continue;
   const scope=await resolveAgencyScope(user);if(!scope.linked&&!scope.demoUnscoped)return res.status(403).json({message:'Agency scope is not configured.'});
   if(!['admin','superadmin','field_technician'].includes(user.role))return res.status(403).json({message:'RMS access is not permitted for this role.'});
   let farmerIds=scope.farmerIds||[];if(user.role==='field_technician'){const scoped=await farmerQueryForUser(user);farmerIds=(await Farmer.find(scoped.query).select('_id').lean()).map(x=>String(x._id));}
   req.rmsAuth={realm,user,companyIds:scope.companyIds||[],agencyIds:scope.agencyIds||[],farmerIds,canManage:false};
   return next();
  }catch{}
 }
 return res.status(401).json({message:'Authentication required.'});
};
exports.requireRmsManage=(req,res,next)=>req.rmsAuth?.canManage?next():res.status(403).json({message:'RMS management permission required.'});
