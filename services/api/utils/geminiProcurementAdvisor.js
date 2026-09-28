const DEFAULT_MODEL=process.env.GEMINI_MODEL||'gemini-3.8-flash';
const safeJson=text=>{try{return JSON.parse(text)}catch{const m=String(text||'').match(/\[[\s\S]*\]/);if(m)try{return JSON.parse(m[0])}catch{}return null}};
async function advise(plans){
 const key=String(process.env.GEMINI_API_KEY||'').trim();
 if(!key||!plans?.length)return {ok:false,status:key?'UNAVAILABLE':'UNAVAILABLE',model:DEFAULT_MODEL,items:[]};
 const payload=plans.slice(0,20).map(p=>({id:String(p._id),sku:p.itemId?.sku||'',item:p.itemId?.name||'',warehouse:p.warehouseId?.name||'',onHand:p.onHand,projectedAvailable:p.projectedAvailable,reorderLevel:p.reorderLevel,minStock:p.minStock,outbound30d:p.outbound30d,daysCover:p.daysCover,suggestedQty:p.suggestedQty,supplier:p.supplierName,estimatedOrderValue:p.estimatedOrderValue,urgency:p.urgency}));
 const prompt=`You are an enterprise procurement analyst. Review these deterministic replenishment calculations. Do not change quantities or approve purchases. Return ONLY a JSON array with one object per id: {"id":"...","summary":"one concise sentence","risk":"LOW|MEDIUM|HIGH|CRITICAL","recommendation":"one concise manual-review recommendation"}. Base your text only on the supplied numbers. Data: ${JSON.stringify(payload)}`;
 try{
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(DEFAULT_MODEL)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:1800,responseMimeType:'application/json'}})});
  if(!response.ok)throw new Error(`Gemini HTTP ${response.status}`);
  const body=await response.json();
  const text=body?.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'';
  const parsed=safeJson(text);
  return {ok:Array.isArray(parsed),status:Array.isArray(parsed)?'READY':'FAILED',model:DEFAULT_MODEL,items:Array.isArray(parsed)?parsed:[]};
 }catch(error){return {ok:false,status:'FAILED',model:DEFAULT_MODEL,items:[],error:error.message};}
}
module.exports={advise,DEFAULT_MODEL};
