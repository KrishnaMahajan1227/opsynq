const DEFAULT_MODEL=()=>String(process.env.AI_MODEL||process.env.GEMINI_MODEL||'gemini-3.8-flash').trim();
const FALLBACK_MODEL='gemini-3.5-flash';
const API_KEY=()=>String(process.env.AI_PROVIDER_API_KEY||process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY||'').trim();
const safeJson=text=>{try{return JSON.parse(text)}catch{const m=String(text||'').match(/\[[\s\S]*\]/);if(m)try{return JSON.parse(m[0])}catch{}return null}};
async function advise(plans){
 const key=API_KEY(),model=DEFAULT_MODEL();
 if(!key||!plans?.length)return {ok:false,status:key?'EMPTY':'NOT_CONFIGURED',model,items:[]};
 const payload=plans.slice(0,20).map(p=>({id:String(p._id),sku:p.itemId?.sku||'',item:p.itemId?.name||'',warehouse:p.warehouseId?.name||'',onHand:p.onHand,projectedAvailable:p.projectedAvailable,reorderLevel:p.reorderLevel,minStock:p.minStock,outbound30d:p.outbound30d,daysCover:p.daysCover,suggestedQty:p.suggestedQty,supplier:p.supplierName,estimatedOrderValue:p.estimatedOrderValue,urgency:p.urgency}));
 const prompt=`You are an enterprise procurement analyst. Review these deterministic replenishment calculations. Do not change quantities or approve purchases. Return ONLY a JSON array with one object per id: {"id":"...","summary":"one concise sentence","risk":"LOW|MEDIUM|HIGH|CRITICAL","recommendation":"one concise manual-review recommendation"}. Base your text only on the supplied numbers. Data: ${JSON.stringify(payload)}`;
 let lastError='';
 for(const candidate of [...new Set([model,FALLBACK_MODEL])]){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  try{
   const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent`,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:1800,responseMimeType:'application/json'}})});
   if(!response.ok){lastError=`decision service HTTP ${response.status}`;if(response.status===404)continue;return {ok:false,status:response.status===401||response.status===403?'INVALID_CREDENTIAL':response.status===429?'RATE_LIMITED':'FAILED',model:candidate,items:[],error:lastError};}
   const body=await response.json();const text=body?.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'';const parsed=safeJson(text);
   if(Array.isArray(parsed))return {ok:true,status:'READY',model:candidate,items:parsed};
   lastError='Decision service returned invalid structured output.';
  }catch(error){lastError=error?.name==='AbortError'?'Decision service request timed out.':(error.message||'Decision service request failed.');}
  finally{clearTimeout(timer)}
 }
 return {ok:false,status:'FAILED',model,items:[],error:lastError};
}
module.exports={advise,DEFAULT_MODEL:DEFAULT_MODEL()};
