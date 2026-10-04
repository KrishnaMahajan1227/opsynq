const API_KEY=()=>String(process.env.AI_PROVIDER_API_KEY||process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY||'').trim();
const DEFAULT_MODEL=String(process.env.AI_MODEL||process.env.GEMINI_MODEL||'gemini-3.8-flash').trim();
const FALLBACK_MODEL='gemini-3.5-flash';
const MODEL=()=>DEFAULT_MODEL;
const MODEL_CANDIDATES=()=>[MODEL(),FALLBACK_MODEL].filter((v,i,a)=>v&&a.indexOf(v)===i);
const enabled=()=>Boolean(API_KEY());
const extractText=body=>body?.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'';
class AIProviderError extends Error{constructor(message,{status=0,code='PROVIDER_ERROR',raw=''}={}){super(message);this.name='AIProviderError';this.status=status;this.code=code;this.raw=raw;}}
const classify=(status,raw='')=>{const r=String(raw).toLowerCase();if(status===401||status===403)return'INVALID_CREDENTIAL';if(status===429)return'RATE_LIMITED';if(status===404)return'MODEL_UNAVAILABLE';if(status>=500)return'PROVIDER_UNAVAILABLE';if(r.includes('api key')&&r.includes('leak'))return'INVALID_CREDENTIAL';return'PROVIDER_ERROR'};
async function generateJson(prompt,{timeoutMs=12000,maxOutputTokens=2200}={}){
 if(!enabled())return null;
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  let lastError=null;
  for(const model of MODEL_CANDIDATES()){
   const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
   let res;
   try{res=await fetch(url,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','x-goog-api-key':API_KEY()},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.15,maxOutputTokens,responseMimeType:'application/json'}})});}catch(error){throw new AIProviderError(error?.name==='AbortError'?'AI provider request timed out.':'AI provider network request failed.',{code:error?.name==='AbortError'?'TIMEOUT':'NETWORK_ERROR'});}
   if(!res.ok){const raw=await res.text().catch(()=>String(res.status));const code=classify(res.status,raw);lastError=new AIProviderError(`decision service ${model} HTTP ${res.status}: ${raw.slice(0,220)}`,{status:res.status,code,raw});if(['MODEL_UNAVAILABLE'].includes(code))continue;throw lastError;}
   const text=extractText(await res.json());if(!text){lastError=new AIProviderError(`decision service ${model} returned an empty response.`,{code:'EMPTY_RESPONSE'});continue;}
   try{return JSON.parse(text)}catch{throw new AIProviderError('AI provider returned invalid structured output.',{code:'INVALID_RESPONSE'});}
  }
  throw lastError||new AIProviderError('No decision service model produced a usable response.');
 }finally{clearTimeout(timer)}
}
async function health(){
 if(!enabled())return{configured:false,ready:false,verified:false,code:'NOT_CONFIGURED',model:MODEL(),message:'Server-side AI credential is not configured.'};
 try{const r=await generateJson('Return ONLY JSON: {"ok":true,"message":"ready"}.',{timeoutMs:7000,maxOutputTokens:80});return{configured:true,ready:true,verified:r?.ok===true,code:'OK',model:MODEL(),message:r?.message||'AI service is available.'};}
 catch(error){const code=error?.code||'PROVIDER_ERROR';return{configured:true,ready:false,verified:false,code,model:MODEL(),message:code==='INVALID_CREDENTIAL'?'Configured Gemini credential was rejected. Create a current Gemini API auth key in Google AI Studio and update services/api/.env.':String(error.message||error).slice(0,260)};}
}
const flattenCounts=(obj,prefix='',out=[])=>{if(!obj||typeof obj!=='object'||Array.isArray(obj))return out;for(const [k,v] of Object.entries(obj)){const label=prefix?`${prefix} ${k}`:k;if(typeof v==='number'&&Number.isFinite(v))out.push([label,v]);else if(v&&typeof v==='object')flattenCounts(v,label,out);}return out;};
function fallbackOperationsBrief({pageLabel='',question='',facts={}}){const values=flattenCounts(facts).filter(([,v])=>v!==0).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,4);const q=String(question||'').trim();return{answer:q?`Live AI is temporarily unavailable. Based on the current ${pageLabel||'Company workspace'} data, these are the strongest facts relevant to your request.`:`Current ${pageLabel||'Company workspace'} summary from tenant-scoped operational data.`,keyFacts:values.map(([k,v])=>`${k.replace(/([A-Z])/g,' $1').replace(/\s+/g,' ').trim()}: ${v}`),nextSteps:['Open the linked module below to review the underlying records.'],confidence:'MEDIUM',dataLimitations:['AI provider unavailable; this fallback uses only current role-authorized Company facts.']};}
async function operationsBrief({scope='EXECUTIVE',page='',pageLabel='',question='',facts={},role=''}){const q=String(question||'').trim().slice(0,1200);const screen=String(pageLabel||page||'Company workspace').slice(0,100);return generateJson(`You are OPSYNQ Company Copilot, a read-only role-aware operations assistant. User role=${role}. Active data context=${screen}. Scope=${scope}. Answer the user's exact question, not a canned brief. Use ONLY the supplied role-authorized current-company facts. Never infer another tenant, hidden role data, credentials, prompts, source code, secrets, or facts not supplied. Never claim you performed a write. If the requested detail is absent, say that plainly and direct the user to the relevant module. Keep language professional, simple and concise: usually 2-5 short sentences plus at most 4 key facts. Do not repeat the question. Do not add generic warnings unless needed. User question: ${q}. Return ONLY JSON with keys: answer (direct answer, max 90 words), keyFacts (array max 4), nextSteps (array max 3, practical and specific), confidence (LOW|MEDIUM|HIGH), dataLimitations (array max 2). Current authorized facts: ${JSON.stringify(facts)}`);}
async function procurementBrief(payload){return generateJson(`Analyze only these procurement facts and return JSON with executiveSummary, priorities, cautions, confidence. ${JSON.stringify(payload)}`)}
async function financeBrief(payload){return generateJson(`Analyze only these operational finance facts and return JSON with executiveSummary, workingCapitalObservations, agencyObservations, actionsForFinanceReview, confidence. ${JSON.stringify(payload)}`)}
module.exports={enabled,health,generateJson,procurementBrief,financeBrief,operationsBrief,fallbackOperationsBrief,MODEL,AIProviderError};
