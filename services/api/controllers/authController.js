const User=require('../models/User');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const {setSessionCookie,demoBearerEnabled}=require('../utils/sessionCookies');

exports.login=async(req,res)=>{
 try{
  if(process.env.NODE_ENV==='production'&&process.env.ALLOW_LEGACY_AUTH!=='1')return res.status(410).json({message:'Legacy Agency sign-in is disabled. Use the unified Opsynq sign-in.'});
  const {mobile,password}=req.body;if(!mobile||!password)return res.status(400).json({message:'Please provide mobile number and password.'});
  const user=await User.findOne({mobile:String(mobile).trim()});if(!user||!(await bcrypt.compare(password,user.password)))return res.status(401).json({message:'Invalid credentials.'});
  if(user.isActive===false)return res.status(403).json({message:'Account is inactive.'});
  const token=jwt.sign({id:user._id,role:user.role,scope:'agency',tv:Number(user.tokenVersion||0)},process.env.JWT_SECRET,{expiresIn:process.env.AGENCY_JWT_EXPIRES_IN||'24h'});
  setSessionCookie(res,'agency',token);
  res.json({...(demoBearerEnabled(user)?{token}:{}),demo:demoBearerEnabled(user),user:{id:user._id,username:user.username,mobile:user.mobile,role:user.role}});
 }catch(err){console.error('Legacy login error:',err.message);res.status(500).json({message:'Authentication failed.'});}
};
