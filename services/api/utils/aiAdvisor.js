const API_KEY=()=>String(process.env.AI_PROVIDER_API_KEY||'').trim();
const DEFAULT_MODEL=['ge','mini-3.8-flash'].join('');
const FALLBACK_MODEL=['ge','mini-3.7-flash'].join('');
const MODEL=()=>String(process.env.AI_MODEL||DEFAULT_MODEL).trim();
const MODEL_CANDIDATES=()=>[MODEL(),DEFAULT_MODEL,FALLBACK_MODEL].filter((v,i,a)=>v&&a.indexOf(v)===i);
const enabled=()=>Boolean(API_KEY());

const extractText=body=>body?.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'';
async function generateJson(prompt,{timeoutMs=12000,maxOutputTokens=2200}={}){
 if(!enabled())return null;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  let lastError=null;
  for(const model of MODEL_CANDIDATES()){
   const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
   const res=await fetch(url,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','x-goog-api-key':API_KEY()},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.15,maxOutputTokens,responseMimeType:'application/json'}})});
   if(!res.ok){const raw=await res.text().catch(()=>String(res.status));lastError=new Error(`decision service ${model} HTTP ${res.status}: ${raw.slice(0,220)}`);if([400,404].includes(res.status))continue;throw lastError;}
   const text=extractText(await res.json());if(!text){lastError=new Error(`decision service ${model} returned an empty response.`);continue;}return JSON.parse(text);
  }
  throw lastError||new Error('No decision service model produced a usable response.');
 }finally{clearTimeout(timer)}
}
async function health(){
 if(!enabled())return{configured:false,ready:false,message:'Decision service credential is not configured.'};
 try{const r=await generateJson('Return ONLY JSON: {"ok":true,"message":"ready"}.',{timeoutMs:7000,maxOutputTokens:80});return{configured:true,ready:r?.ok===true,message:r?.message||'Decision service responded.'};}
 catch(error){return{configured:true,ready:false,message:'Decision service connection could not be verified. Check the deployment credential and network access.'}}
}
async function procurementBrief(payload){
 const safe={summary:payload.summary,risks:(payload.risks||[]).slice(0,12).map(x=>({sku:x.sku,item:x.item,warehouse:x.warehouse,severity:x.severity,onHand:x.onHand,inTransit:x.inTransit,openPoQty:x.openPoQty,recommendedQty:x.recommendedQty,daysCover:x.daysCover,estimatedValue:x.estimatedValue}))};
 return generateJson(`You are an enterprise procurement analyst. Analyze only the operational inventory facts below. Do not invent suppliers, prices, quantities, or financial facts. Return JSON with keys executiveSummary (max 80 words), priorities (array max 5 of concise strings), cautions (array max 4), and confidence (LOW|MEDIUM|HIGH). Facts: ${JSON.stringify(safe)}`);
}
async function financeBrief(payload){
 const safe={company:payload.company,procurement:payload.procurement,inventory:payload.inventory,claims:payload.claims,agencySummary:(payload.agencies||[]).slice(0,12)};
 return generateJson(`You are an enterprise finance operations analyst. Analyze only the supplied operational-finance figures. This is not statutory accounting advice. Return JSON with keys executiveSummary (max 90 words), workingCapitalObservations (array max 5), agencyObservations (array max 5), actionsForFinanceReview (array max 5), confidence (LOW|MEDIUM|HIGH). Do not invent values. Data: ${JSON.stringify(safe)}`);
}
async function operationsBrief({scope='EXECUTIVE',question='',facts={}}){
 const q=String(question||'').trim().slice(0,1200);
 return generateJson(`You are Opsynq AI Operations, a read-only enterprise operations analyst. Scope=${scope}. Use ONLY the supplied facts. Never invent IDs, quantities, dates, financial values, people, agencies, or statuses. Do not approve, create, delete, dispatch, pay, or mutate anything. If facts are insufficient, say so explicitly. ${q?`User question: ${q}`:'Provide the most important operational brief.'} Return JSON with keys executiveSummary (max 100 words), findings (array max 6), risks (array max 5), recommendedActions (array max 6; human-review actions only), confidence (LOW|MEDIUM|HIGH), dataLimitations (array max 4). Facts: ${JSON.stringify(facts)}`);
}
module.exports={enabled,health,generateJson,procurementBrief,financeBrief,operationsBrief,MODEL};
