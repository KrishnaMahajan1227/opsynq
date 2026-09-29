const User=require('../models/User');
const PlatformUser=require('../models/platform/PlatformUser');
const {readSessionToken,decodeAndVerify}=require('../utils/sessionCookies');

module.exports=async(req,res,next)=>{
  try{
    for(const realm of ['platform','agency']){
      const token=readSessionToken(req,realm);if(!token)continue;
      try{
        const decoded=decodeAndVerify(token);if(decoded.scope!==realm)continue;
        if(realm==='platform'){
          const user=await PlatformUser.findById(decoded.id).select('_id isActive approvalStatus tokenVersion').lean();
          if(user&&user.isActive&&user.approvalStatus==='APPROVED'&&Number(decoded.tv||0)===Number(user.tokenVersion||0)){req.fileAccessRealm='platform';return next();}
        }else{
          const user=await User.findById(decoded.id).select('_id isActive tokenVersion').lean();
          if(user&&user.isActive!==false&&Number(decoded.tv||0)===Number(user.tokenVersion||0)){req.fileAccessRealm='agency';return next();}
        }
      }catch{}
    }
    return res.status(401).json({message:'Authentication required.'});
  }catch{return res.status(401).json({message:'Authentication required.'});}
};
