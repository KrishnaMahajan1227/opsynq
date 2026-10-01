const path=require('path');
require('dotenv').config({path:path.resolve(__dirname,'../.env')});
const mongoose=require('mongoose');

const DEMO_PLATFORM_MOBILES=['9000000001','9000000002','9000000003','9000000004','9000000005','9000000006','9000000007','9000000008','9100000001','9100000002','9100000003','9100000004','9100000005'];
const DEMO_AGENCY_MOBILES=['9200000001','9200000002','9200000003','9200000004','9300000001','9300000002','9300000003','9300000004','9400000001','9400000002','9400000003'];
const DEMO_ORG_CODES=['OPSYNQ','SKEPL','AVSIL','NAGFOPS','NASRINS','PUNESVC'];

function dbIdentity(){
 const raw=String(process.env.MONGO_URI||'').trim();
 if(!raw)throw new Error('MONGO_URI is not configured.');
 let host='';let uriDb='';
 try{const u=new URL(raw);host=u.hostname;uriDb=decodeURIComponent((u.pathname||'').replace(/^\//,''));}catch{throw new Error('MONGO_URI is invalid.');}
 const dbName=String(process.env.MONGO_DB_NAME||uriDb||'OPSYNQ').trim();
 return{raw,host,dbName};
}
function assertStaticSafety({destructive=false}={}){
 const id=dbIdentity();
 const purpose=String(process.env.OPSYNQ_DB_PURPOSE||'').trim().toLowerCase();
 if(!['demo','dev','test'].includes(purpose))throw new Error(`Refusing database reset: OPSYNQ_DB_PURPOSE must be demo/dev/test (current: ${purpose||'unset'}).`);
 if(/prod|production|live/i.test(`${id.dbName} ${id.host}`))throw new Error(`Refusing database reset: target looks production-like (${id.dbName} @ ${id.host}).`);
 if(destructive&&String(process.env.OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET||'')!=='YES')throw new Error('Refusing destructive reset: set OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET=YES only for the verified demo/dev database.');
 return id;
}
async function connect(){
 const id=assertStaticSafety();
 await mongoose.connect(id.raw,{dbName:id.dbName,serverSelectionTimeoutMS:12000,socketTimeoutMS:45000,maxPoolSize:10});
 return id;
}
async function validateAccounts(){
 const db=mongoose.connection.db;
 const platform=await db.collection('platformusers').find({}).project({_id:1,mobile:1,email:1,role:1,password:1,organizationId:1}).toArray();
 const legacy=await db.collection('users').find({}).project({_id:1,mobile:1,email:1,username:1,role:1,password:1}).toArray();
 const platformDemo=new Set(DEMO_PLATFORM_MOBILES), agencyDemo=new Set(DEMO_AGENCY_MOBILES);
 const missingPlatform=DEMO_PLATFORM_MOBILES.filter(m=>!platform.some(x=>String(x.mobile)===m));
 const missingAgency=DEMO_AGENCY_MOBILES.filter(m=>!legacy.some(x=>String(x.mobile)===m));
 if(missingPlatform.length||missingAgency.length)throw new Error(`Refusing wipe: expected existing demo accounts are missing (platform=${missingPlatform.join(',')||'none'}, agency=${missingAgency.join(',')||'none'}). Seed/account identities must be established before destructive reset.`);
 const unknownPlatform=platform.filter(x=>x.role!=='platform_superadmin'&&!platformDemo.has(String(x.mobile||'')));
 const unknownLegacy=legacy.filter(x=>!agencyDemo.has(String(x.mobile||''))&&x.role!=='superadmin');
 const legacyRootAdmins=legacy.filter(x=>!agencyDemo.has(String(x.mobile||''))&&x.role==='superadmin');
 if(unknownPlatform.length||unknownLegacy.length||legacyRootAdmins.length>1)throw new Error(`Refusing wipe: non-demo user accounts detected (platform=${unknownPlatform.length}, agency=${unknownLegacy.length}, legacy-root-superadmins=${legacyRootAdmins.length}). This does not look like an isolated demo database.`);
 const orgs=await db.collection('organizations').find({code:{$in:DEMO_ORG_CODES}}).project({_id:1,code:1,parentOrganization:1,type:1}).toArray();
 const missingOrgs=DEMO_ORG_CODES.filter(code=>!orgs.some(o=>o.code===code));
 if(missingOrgs.length)throw new Error(`Refusing wipe: expected demo tenant organizations are missing: ${missingOrgs.join(', ')}.`);
 const protectedPlatform=platform.filter(x=>x.role==='platform_superadmin'||platformDemo.has(String(x.mobile||'')));
 const protectedLegacy=legacy.filter(x=>agencyDemo.has(String(x.mobile||''))||x.role==='superadmin');
 return{platform:protectedPlatform,legacy:protectedLegacy,orgs};
}
async function validateTarget({destructive=false}={}){
 const id=assertStaticSafety({destructive});
 if(mongoose.connection.readyState!==1)await mongoose.connect(id.raw,{dbName:id.dbName,serverSelectionTimeoutMS:12000,socketTimeoutMS:45000,maxPoolSize:10});
 const protectedState=await validateAccounts();
 return{id,protectedState};
}
function accountSnapshot(state){
 const norm=(realm,x)=>({realm,id:String(x._id),mobile:String(x.mobile||''),email:String(x.email||''),username:String(x.username||''),role:String(x.role||''),organizationId:String(x.organizationId||''),passwordHash:String(x.password||'')});
 return[...state.platform.map(x=>norm('platform',x)),...state.legacy.map(x=>norm('agency',x))];
}
module.exports={DEMO_PLATFORM_MOBILES,DEMO_AGENCY_MOBILES,DEMO_ORG_CODES,dbIdentity,assertStaticSafety,connect,validateTarget,accountSnapshot};
