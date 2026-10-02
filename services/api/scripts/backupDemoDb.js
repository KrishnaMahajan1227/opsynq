const fs=require('fs');const path=require('path');const mongoose=require('mongoose');
const {validateTarget,accountSnapshot}=require('./demoDbGuard');
const stamp=()=>new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
async function writeCollection(db,name,file){
 const out=fs.createWriteStream(file,{encoding:'utf8'});let count=0;
 for await(const doc of db.collection(name).find({})){if(!out.write(JSON.stringify(doc)+'\n'))await new Promise(r=>out.once('drain',r));count++;}
 await new Promise((resolve,reject)=>out.end(resolve).on('error',reject));return count;
}
(async()=>{
 const {id,protectedState}=await validateTarget({destructive:false});
 const dir=path.resolve(__dirname,'../backups',`demo-reset-${stamp()}`);fs.mkdirSync(dir,{recursive:true});
 const cols=(await mongoose.connection.db.listCollections({}, {nameOnly:true}).toArray()).map(x=>x.name).filter(x=>!x.startsWith('system.')).sort();
 const counts={};for(const name of cols){if(['platformusers','users'].includes(name)){counts[name]=await mongoose.connection.db.collection(name).estimatedDocumentCount();console.log(`backup ${name}: ${counts[name]} protected account records retained in DB; raw credentials not exported`);continue;}counts[name]=await writeCollection(mongoose.connection.db,name,path.join(dir,`${name}.ndjson`));console.log(`backup ${name}: ${counts[name]}`)}
 const manifest={createdAt:new Date().toISOString(),complete:true,targetFingerprint:id.targetFingerprint,counts,protectedAccountDigests:accountSnapshot(protectedState)};
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(`BACKUP_DIR=${dir}`);
})().catch(e=>{console.error(`Backup failed: ${e.message}`);process.exitCode=1}).finally(async()=>{try{await mongoose.connection.close()}catch{}});
