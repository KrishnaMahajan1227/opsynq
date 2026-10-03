const path=require('path');
require('dotenv').config({path:path.resolve(__dirname,'../.env')});
const mongoose=require('mongoose');
const {assertStaticSafety}=require('./demoDbGuard');
const Organization=require('../models/platform/Organization');
const User=require('../models/User');
const AgencyUserLink=require('../models/platform/AgencyUserLink');

const BASE_CODES=['OPSYNQ','SKEPL','AVSIL','NAGFOPS','NASRINS','PUNESVC'];
const BASE_MOBILES=['9200000001','9200000002','9200000003','9200000004','9300000001','9300000002','9300000003','9300000004','9400000001','9400000002','9400000003'];
const TARGETS=[
 {mobile:'9500000001',username:'haryana.superadmin',email:'haryana.superadmin@opsynq.demo',role:'superadmin',clone:'9200000001'},
 {mobile:'9500000002',username:'haryana.admin',email:'haryana.admin@opsynq.demo',role:'admin',clone:'9200000002'},
 {mobile:'9500000003',username:'haryana.tech01',email:'haryana.tech01@opsynq.demo',role:'field_technician',clone:'9200000003'},
 {mobile:'9500000004',username:'haryana.tech02',email:'haryana.tech02@opsynq.demo',role:'field_technician',clone:'9200000004'},
];

(async()=>{
 const id=assertStaticSafety({write:true});
 await mongoose.connect(id.raw,{dbName:id.dbName,serverSelectionTimeoutMS:12000,socketTimeoutMS:45000,maxPoolSize:10});
 const db=mongoose.connection.db;
 const orgs=await db.collection('organizations').find({}).project({code:1,type:1,parentOrganization:1}).toArray();
 const unexpected=orgs.filter(o=>![...BASE_CODES,'HRYOPS'].includes(String(o.code||'')));
 const missingBase=BASE_CODES.filter(c=>!orgs.some(o=>String(o.code)===c));
 if(unexpected.length||missingBase.length)throw new Error(`Refusing Haryana bootstrap: organization set is not isolated (missing=${missingBase.join(',')||'none'}, unexpected=${unexpected.map(x=>x.code||x._id).join(',')||'none'}).`);
 const company=orgs.find(o=>String(o.code)==='SKEPL');
 let agency=await Organization.findOne({code:'HRYOPS'});
 if(!agency){
   agency=await Organization.create({
     name:'Haryana Renewable Field Operations',
     code:'HRYOPS',type:'AGENCY',parentOrganization:company._id,country:'India',state:'Haryana',status:'ACTIVE',
     contact:{name:'Haryana Demo Operations',email:'haryana.operations@opsynq.demo',mobile:'9500000002'},
     address:{line1:'Karnal Solar Service Centre',city:'Karnal',district:'Karnal',state:'Haryana',country:'India',pincode:'132001'},
     metadata:{demo:true,region:'Haryana',purpose:'Dedicated second-state agency for client demo'}
   });
   console.log('created HRYOPS Haryana agency');
 }else{
   if(String(agency.type)!=='AGENCY'||String(agency.parentOrganization)!==String(company._id)||String(agency.state)!=='Haryana')throw new Error('Existing HRYOPS organization does not match the approved demo tenant identity.');
   console.log('verified existing HRYOPS Haryana agency');
 }
 const existingLegacy=await User.find({}).select('_id mobile username email role password isActive').lean();
 const unknown=existingLegacy.filter(u=>!BASE_MOBILES.includes(String(u.mobile||''))&&!TARGETS.some(t=>t.mobile===String(u.mobile||'')));
 if(unknown.length)throw new Error(`Refusing Haryana bootstrap: unexpected agency accounts exist (${unknown.map(x=>x.mobile).join(',')}).`);
 for(const t of TARGETS){
   let user=existingLegacy.find(x=>String(x.mobile)===t.mobile);
   if(!user){
     const source=existingLegacy.find(x=>String(x.mobile)===t.clone);
     if(!source?.password)throw new Error(`Source demo account ${t.clone} unavailable; cannot create credential-compatible Haryana demo account.`);
     user=await User.create({
       username:t.username,email:t.email,mobile:t.mobile,password:source.password,role:t.role,isActive:true,
       lastLocation:{latitude:29.6857,longitude:76.9905,accuracy:10,address:'Karnal, Haryana',capturedAt:new Date(),updatedAt:new Date()}
     });
     console.log(`created ${t.username}`);
   }else{
     if(String(user.username)!==t.username||String(user.email||'').toLowerCase()!==t.email||String(user.role)!==t.role)throw new Error(`Existing Haryana account ${t.mobile} identity mismatch.`);
   }
   const link=await AgencyUserLink.findOne({companyId:company._id,agencyId:agency._id,legacyUserId:user._id});
   if(!link)await AgencyUserLink.create({companyId:company._id,agencyId:agency._id,legacyUserId:user._id,role:t.role,isActive:true});
   else if(!link.isActive||String(link.role)!==t.role)throw new Error(`Existing Haryana tenant mapping mismatch for ${t.username}.`);
 }
 console.log('Haryana agency bootstrap complete. Existing Maharashtra accounts were not changed.');
})().catch(e=>{console.error(`Haryana bootstrap failed: ${e.message}`);process.exitCode=1}).finally(async()=>{try{await mongoose.connection.close()}catch{}});