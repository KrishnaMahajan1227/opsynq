require('dotenv').config({path:require('path').resolve(__dirname,'../.env')});
const bcrypt=require('bcryptjs');
const mongoose=require('mongoose');
const connectDB=require('../config/db');
const PlatformUser=require('../models/platform/PlatformUser');
const Organization=require('../models/platform/Organization');
const AuditLog=require('../models/platform/AuditLog');
(async()=>{
 await connectDB();
 const mobile=String(process.env.PLATFORM_SUPERADMIN_MOBILE||'').trim();
 const password=String(process.env.PLATFORM_SUPERADMIN_PASSWORD||'');
 const email=String(process.env.PLATFORM_SUPERADMIN_EMAIL||'').trim().toLowerCase();
 const name=String(process.env.PLATFORM_SUPERADMIN_NAME||'Opsynq Platform Superadmin').trim();
 if(!mobile||!password) throw new Error('Existing .env must contain PLATFORM_SUPERADMIN_MOBILE and PLATFORM_SUPERADMIN_PASSWORD.');
 let platform=await Organization.findOne({type:'PLATFORM'});
 if(!platform) platform=await Organization.create({name:'Opsynq Platform',code:'OPSYNQ',type:'PLATFORM',status:'ACTIVE',country:'Global',metadata:{product:'Opsynq',bootstrapVersion:7}});
 else {platform.name='Opsynq Platform';platform.code='OPSYNQ';platform.status='ACTIVE';platform.metadata={...(platform.metadata||{}),product:'Opsynq',bootstrapVersion:7};await platform.save();}
 const existing=await PlatformUser.findOne({$or:[{mobile},...(email?[{email}]:[])]});
 let user;
 if(existing){
  // Existing SuperAdmin identity and credentials are immutable during bootstrap.
  // The wipe/seed demo flow relies on the same ID, hash, role and tenant mapping.
  user=existing;
 } else {
  const hashed=await bcrypt.hash(password,12);
  user=await PlatformUser.create({name,email:email||undefined,mobile,password:hashed,role:'platform_superadmin',organizationId:platform._id,approvalStatus:'APPROVED',isActive:true});
 }
 await AuditLog.create({organizationId:platform._id,actorId:user._id,actorType:'PlatformUser',action:'PLATFORM_BOOTSTRAP_VERIFIED',entityType:'Organization',entityId:platform._id,after:{platform:'OPSYNQ',superadmin:String(user._id),version:7}});
 console.log('✓ Opsynq platform organization ready');
 console.log(`✓ Platform Superadmin ready: ${user.email||user.mobile}`);
 console.log('✓ Bootstrap is idempotent; re-running updates the same account instead of creating duplicates.');
 await mongoose.connection.close();
})().catch(async e=>{console.error('Bootstrap failed:',e.message);try{await mongoose.connection.close()}catch{}process.exit(1)});
