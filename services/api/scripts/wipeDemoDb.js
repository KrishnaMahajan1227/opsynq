const fs=require('fs');const path=require('path');const mongoose=require('mongoose');
const {validateTarget}=require('./demoDbGuard');
function latestBackup(dbName){
 const root=path.resolve(__dirname,'../backups');if(!fs.existsSync(root))return null;
 const candidates=fs.readdirSync(root).filter(x=>x.startsWith('demo-reset-')).map(x=>path.join(root,x,'manifest.json')).filter(fs.existsSync).map(file=>{try{return{file,m:JSON.parse(fs.readFileSync(file,'utf8'))}}catch{return null}}).filter(Boolean).filter(x=>x.m.complete&&x.m.dbName===dbName).sort((a,b)=>String(b.m.createdAt).localeCompare(String(a.m.createdAt)));
 return candidates[0]||null;
}
(async()=>{
 const {id,protectedState}=await validateTarget({destructive:true});
 const backup=latestBackup(id.dbName);if(!backup)throw new Error('No completed matching demo backup found. Run npm run demo:backup first.');
 const age=Date.now()-new Date(backup.m.createdAt).getTime();if(!Number.isFinite(age)||age>24*60*60*1000)throw new Error('Latest matching backup is older than 24 hours. Create a fresh backup before wiping.');
 const db=mongoose.connection.db;const protectedCollections=new Set(['platformusers','users','organizations','agencyuserlinks']);
 const cols=(await db.listCollections({}, {nameOnly:true}).toArray()).map(x=>x.name).filter(x=>!x.startsWith('system.'));
 for(const name of cols){if(protectedCollections.has(name))continue;const r=await db.collection(name).deleteMany({});console.log(`wiped ${name}: ${r.deletedCount}`)}
 const keepOrgIds=new Set(protectedState.orgs.map(x=>String(x._id)));
 for(const x of protectedState.platform)if(x.organizationId)keepOrgIds.add(String(x.organizationId));
 const keepIds=[...keepOrgIds].map(x=>new mongoose.Types.ObjectId(x));
 const orgDelete=await db.collection('organizations').deleteMany({_id:{$nin:keepIds}});console.log(`wiped non-demo organizations: ${orgDelete.deletedCount}`);
 const platformIds=protectedState.platform.map(x=>x._id),legacyIds=protectedState.legacy.map(x=>x._id);
 await db.collection('platformusers').deleteMany({_id:{$nin:platformIds}});await db.collection('users').deleteMany({_id:{$nin:legacyIds}});
 const linkDelete=await db.collection('agencyuserlinks').deleteMany({$or:[{legacyUserId:{$nin:legacyIds}},{companyId:{$nin:keepIds}},{agencyId:{$nin:keepIds}}]});console.log(`wiped non-demo agency links: ${linkDelete.deletedCount}`);
 console.log('Demo wipe completed. MongoDB ObjectIds do not use SQL-style sequences, so no sequence reset is required.');
})().catch(e=>{console.error(`Wipe blocked/failed: ${e.message}`);process.exitCode=1}).finally(async()=>{try{await mongoose.connection.close()}catch{}});
