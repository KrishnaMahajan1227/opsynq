const User=require('../models/User');
const {readSessionToken,decodeAndVerify}=require('../utils/sessionCookies');
const {resolveAgencyScope}=require('../utils/agencyScope');

exports.protect=async(req,res,next)=>{
  const token=readSessionToken(req,'agency');
  if(!token)return res.status(401).json({message:'Authentication required.'});
  try{
    const decoded=decodeAndVerify(token);
    if(decoded.scope!=='agency')return res.status(401).json({message:'Invalid session scope.'});
    const user=await User.findById(decoded.id).select('-password');
    if(!user||user.isActive===false)return res.status(401).json({message:'User account is unavailable.'});
    if(Number(decoded.tv||0)!==Number(user.tokenVersion||0))return res.status(401).json({message:'Session has been invalidated. Please sign in again.'});
    req.user=user;
    req.agencyScope=await resolveAgencyScope(user);
    next();
  }catch(err){return res.status(401).json({message:'Invalid or expired session.'});}
};
