const API_KEY=()=>process.env.GEMINI_API_KEY||process.env.GOOGLE_GEMINI_API_KEY||process.env.GOOGLE_AI_API_KEY||process.env.GOOGLE_API_KEY||'';
const MODEL=()=>process.env.GEMINI_MODEL||'gemini-2.5-flash';
const enabled=()=>Boolean(API_KEY());
async function generateJson(prompt){
 if(!enabled())return null;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
 try{
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL())}:generateContent?key=${encodeURIComponent(API_KEY())}`;
  const res=await fetch(url,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.2,responseMimeType:'application/json'}})});
  if(!res.ok)return null;const body=await res.json();const text=body?.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'';if(!text)return null;return JSON.parse(text);
 }catch{return null}finally{clearTimeout(timer)}
}
async function procurementBrief(payload){
 const safe={summary:payload.summary,risks:(payload.risks||[]).slice(0,12).map(x=>({sku:x.sku,item:x.item,warehouse:x.warehouse,severity:x.severity,onHand:x.onHand,inTransit:x.inTransit,openPoQty:x.openPoQty,recommendedQty:x.recommendedQty,daysCover:x.daysCover,estimatedValue:x.estimatedValue}))};
 return generateJson(`You are an enterprise procurement analyst. Analyze only the operational inventory facts below. Do not invent suppliers, prices, quantities, or financial facts. Return JSON with keys executiveSummary (max 80 words), priorities (array max 5 of concise strings), cautions (array max 4), and confidence (LOW|MEDIUM|HIGH). Facts: ${JSON.stringify(safe)}`);
}
async function financeBrief(payload){
 const safe={company:payload.company,procurement:payload.procurement,inventory:payload.inventory,claims:payload.claims,agencySummary:(payload.agencies||[]).slice(0,12)};
 return generateJson(`You are an enterprise finance operations analyst. Analyze only the supplied operational-finance figures. This is not statutory accounting advice. Return JSON with keys executiveSummary (max 90 words), workingCapitalObservations (array max 5), agencyObservations (array max 5), actionsForFinanceReview (array max 5), confidence (LOW|MEDIUM|HIGH). Do not invent values. Data: ${JSON.stringify(safe)}`);
}
module.exports={enabled,procurementBrief,financeBrief};
