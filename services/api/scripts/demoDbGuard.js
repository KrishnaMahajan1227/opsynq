const path=require('path');
require('dotenv').config({path:path.resolve(__dirname,'../.env')});
const mongoose=require('mongoose');
const crypto=require('crypto');

const DEMO_PLATFORM_MOBILES=['9000000001','9000000002','9000000003','9000000004','9000000005','9000000006','9000000007','9000000008','9100000001','9100000002','9100000003','9100000004','9100000005'];
const DEMO_AGENCY_MOBILES=['9200000001','9200000002','9200000003','9200000004','9300000001','9300000002','9300000003','9300000004','9400000001','9400000002','9400000003','9500000001','9500000002','9500000003','9500000004'];
const DEMO_ORG_CODES=['OPSYNQ','SKEPL','AVSIL','NAGFOPS','NASRINS','PUNESVC','HRYOPS'];

function dbIdentity(){
 const raw=String(process.env.MONGO_URI||'').trim();
 if(!raw)throw new Error('MONGO_URI is not configured.');
 let host='';let uriDb='';
 try{const u=new URL(raw);host=u.hostname;uriDb=decodeURIComponent((u.pathname||'').replace(/^\//,''));}catch{throw new Error('MONGO_URI is invalid.');}
 const dbName=String(process.env.MONGO_DB_NAME||uriDb||'OPSYNQ').trim();
 const targetFingerprint=crypto.createHash('sha256').update(`${host}|${dbName}`).digest('hex');
 return{raw,host,dbName,targetFingerprint};
}
function assertStaticSafety({destructive=false,write=false}={}){
 const id=dbIdentity();
 const purpose=String(process.env.OPSYNQ_DB_PURPOSE||'').trim().toLowerCase();
 if((write||destructive)&&!['demo','dev','test'].includes(purpose))throw new Error('Refusing database write: OPSYNQ_DB_PURPOSE must be demo/dev/test. Set it only after verifying this is the demo/dev target.');
 if(/prod|production|live/i.test(`${id.dbName} ${id.host}`))throw new Error('Refusing database operation: target identity looks production-like. No data was changed.');
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
 if(missingPlatform.length||missingAgency.length)throw new Error(`Refusing demo operation: expected demo accounts are missing (platform-count=${missingPlatform.length}, agency-count=${missingAgency.length}). No account was created or changed.`);
 const platformRoots=platform.filter(x=>x.role==='platform_superadmin');
 const unknownPlatform=platform.filter(x=>x.role!=='platform_superadmin'&&!platformDemo.has(String(x.mobile||'')));
 const unknownLegacy=legacy.filter(x=>!agencyDemo.has(String(x.mobile||'')));
 if(platformRoots.length!==1||unknownPlatform.length||unknownLegacy.length)throw new Error(`Refusing demo operation: account set is not isolated (platform-superadmins=${platformRoots.length}, unknown-platform=${unknownPlatform.length}, unknown-agency=${unknownLegacy.length}). No data was changed.`);
 const allOrgs=await db.collection('organizations').find({}).project({_id:1,code:1,parentOrganization:1,type:1}).toArray();
 const orgs=allOrgs.filter(o=>DEMO_ORG_CODES.includes(String(o.code||'')));
 const missingOrgs=DEMO_ORG_CODES.filter(code=>!orgs.some(o=>o.code===code));
 const unknownOrgs=allOrgs.filter(o=>!DEMO_ORG_CODES.includes(String(o.code||'')));
 if(missingOrgs.length||unknownOrgs.length)throw new Error(`Refusing demo operation: organization set is not isolated (missing=${missingOrgs.join(',')||'none'}, unexpected=${unknownOrgs.map(o=>o.code||o._id).join(',')||'none'}). No automatic deletion was performed.`);
 const links=await db.collection('agencyuserlinks').find({}).project({_id:1,legacyUserId:1,companyId:1,agencyId:1,isActive:1}).toArray();
 const legacyIds=new Set(legacy.map(x=>String(x._id)));const orgIds=new Set(orgs.map(x=>String(x._id)));
 const invalidLinks=links.filter(x=>!legacyIds.has(String(x.legacyUserId))||!orgIds.has(String(x.companyId))||!orgIds.has(String(x.agencyId))||x.isActive===false);
 if(links.length!==DEMO_AGENCY_MOBILES.length||invalidLinks.length)throw new Error(`Refusing demo operation: agency tenant mappings are not the expected isolated set (links=${links.length}, invalid=${invalidLinks.length}). No data was changed.`);
 const protectedPlatform=[...platformRoots,...platform.filter(x=>platformDemo.has(String(x.mobile||'')))];
 const protectedLegacy=legacy.filter(x=>agencyDemo.has(String(x.mobile||'')));
 return{platform:protectedPlatform,legacy:protectedLegacy,orgs,links};
}
async function scanNonProtectedData(){
 const db=mongoose.connection.db;const protectedCollections=new Set(['platformusers','users','organizations','agencyuserlinks']);
 const cols=(await db.listCollections({}, {nameOnly:true}).toArray()).map(x=>x.name).filter(x=>!x.startsWith('system.')&&!protectedCollections.has(x));
 const counts={};
 for(const name of cols){const count=await db.collection(name).estimatedDocumentCount();if(count)counts[name]=count;}
 return counts;
}
async function validateTarget({destructive=false,write=false,requireClean=false}={}){
 const id=assertStaticSafety({destructive,write});
 if(mongoose.connection.readyState!==1)await mongoose.connect(id.raw,{dbName:id.dbName,serverSelectionTimeoutMS:12000,socketTimeoutMS:45000,maxPoolSize:10});
 const protectedState=await validateAccounts();
 const nonProtectedCounts=requireClean?await scanNonProtectedData():{};
 if(requireClean&&Object.keys(nonProtectedCounts).length){
  const detail=Object.entries(nonProtectedCounts).sort(([a],[b])=>a.localeCompare(b)).map(([name,count])=>`${name}=${count}`).join(', ');
  throw new Error(`Refusing demo seed: non-protected data still exists (${detail}). No automatic deletion was performed.`);
 }
 return{id,protectedState,nonProtectedCounts};
}

async function cleanupKnownDemoRmsBootstrap(){
 const id=assertStaticSafety({destructive:true,write:true});
 if(mongoose.connection.readyState!==1)await mongoose.connect(id.raw,{dbName:id.dbName,serverSelectionTimeoutMS:12000,socketTimeoutMS:45000,maxPoolSize:10});
 const protectedState=await validateAccounts();
 const counts=await scanNonProtectedData();
 const allowed=new Set(['rmsproviders','rmsruleconfigs']);
 const unexpected=Object.keys(counts).filter(name=>!allowed.has(name));
 if(unexpected.length)throw new Error(`Refusing RMS bootstrap cleanup: other non-protected data exists (${unexpected.map(name=>`${name}=${counts[name]}`).join(', ')}). No data was changed.`);
 const db=mongoose.connection.db;
 const companyIds=new Set(protectedState.orgs.filter(o=>String(o.type)==='COMPANY').map(o=>String(o._id)));
 const providers=await db.collection('rmsproviders').find({}).toArray();
 const rules=await db.collection('rmsruleconfigs').find({}).toArray();
 const invalidProviders=providers.filter(p=>!companyIds.has(String(p.companyId||''))||String(p.code||'')!=='DEMO-RMS'||String(p.type||'')!=='DEMO_SIMULATOR');
 const invalidRules=rules.filter(r=>!companyIds.has(String(r.companyId||'')));
 if(invalidProviders.length||invalidRules.length)throw new Error(`Refusing RMS bootstrap cleanup: unexpected RMS configuration exists (providers=${invalidProviders.length}, rules=${invalidRules.length}). No data was changed.`);
 if(providers.length){const r=await db.collection('rmsproviders').deleteMany({_id:{$in:providers.map(x=>x._id)}});console.log(`cleaned auto-recreated demo RMS providers: ${r.deletedCount}`)}
 if(rules.length){const r=await db.collection('rmsruleconfigs').deleteMany({_id:{$in:rules.map(x=>x._id)}});console.log(`cleaned auto-recreated demo RMS rule configs: ${r.deletedCount}`)}
 return{providers:providers.length,rules:rules.length};
}

function accountSnapshot(state){
 const hash=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
 const norm=(realm,x)=>({
  realm,
  idDigest:hash(`${realm}|${String(x._id)}`),
  stateDigest:hash(JSON.stringify([String(x._id),String(x.mobile||''),String(x.email||''),String(x.username||''),String(x.role||''),String(x.organizationId||''),String(x.password||'')]))
 });
 return[...state.platform.map(x=>norm('platform',x)),...state.legacy.map(x=>norm('agency',x))];
}

module.exports={DEMO_PLATFORM_MOBILES,DEMO_AGENCY_MOBILES,DEMO_ORG_CODES,dbIdentity,assertStaticSafety,connect,validateAccounts,scanNonProtectedData,validateTarget,cleanupKnownDemoRmsBootstrap,accountSnapshot};
