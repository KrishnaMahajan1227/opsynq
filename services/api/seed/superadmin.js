const path=require('path');
require('dotenv').config({path:path.resolve(__dirname,'../.env')});
const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const connectDB=require('../config/db');
const User=require('../models/User');
(async()=>{
 await connectDB();
 const existing=await User.findOne({role:'superadmin'});
 if(existing){console.log(`Legacy SuperAdmin already exists: ${existing.username}`);return;}
 const username=String(process.env.LEGACY_SUPERADMIN_USERNAME||'').trim();
 const mobile=String(process.env.LEGACY_SUPERADMIN_MOBILE||'').trim();
 const password=String(process.env.LEGACY_SUPERADMIN_PASSWORD||'');
 if(!username||!mobile||!password)throw new Error('Set LEGACY_SUPERADMIN_USERNAME, LEGACY_SUPERADMIN_MOBILE and LEGACY_SUPERADMIN_PASSWORD before first legacy SuperAdmin seed.');
 const hashed=await bcrypt.hash(password,12);
 await User.create({username,mobile,password:hashed,role:'superadmin',isActive:true});
 console.log(`Legacy SuperAdmin created: ${username}`);
})().catch(e=>{console.error('Legacy SuperAdmin seed failed:',e.message);process.exitCode=1}).finally(async()=>{try{await mongoose.connection.close()}catch{}});
