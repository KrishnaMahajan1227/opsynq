const text=v=>String(v??'').trim();
const printable=v=>{
 if(v===undefined||v===null)return'';
 if(v instanceof Date)return v.toISOString();
 if(typeof v==='object')return JSON.stringify(v);
 return String(v);
};
const pick=(obj,fields=[])=>Object.fromEntries(fields.map(k=>[k,obj?.[k]]).filter(([,v])=>v!==undefined));
const differences=(existing,incoming,fields=[])=>fields.map(field=>({field,existing:existing?.[field]??'',incoming:incoming?.[field]??'',changed:printable(existing?.[field])!==printable(incoming?.[field])})).filter(x=>x.changed);
function payload({entityType,key='',existing,incoming,fields=[],allowedActions=['UPDATE','SKIP'],message='A matching record already exists.'}){
 const current=typeof existing?.toObject==='function'?existing.toObject():existing||{};
 const next=incoming||{};
 return {message,conflict:{kind:'DUPLICATE_RECORD',entityType,key:text(key),existingId:String(current?._id||''),existing:pick(current,fields),incoming:pick(next,fields),differences:differences(current,next,fields),allowedActions}};
}
function send(res,args){return res.status(409).json(payload(args));}
module.exports={payload,send,differences,pick};
