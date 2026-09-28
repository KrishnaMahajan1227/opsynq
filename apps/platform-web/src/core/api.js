import {cacheResponse,getCachedResponse,queueWrite} from './offlineStore';
export const API=String(import.meta.env.VITE_API_URL||'').replace(/\/$/,'')||(import.meta.env.PROD?'':'http://localhost:3000');
export const tokenKey='opsynq_platform_token';
export const api=async(path,options={})=>{
 const token=localStorage.getItem(tokenKey),method=String(options.method||'GET').toUpperCase(),isForm=options.body instanceof FormData,controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000),cacheKey=`${method}:${path}`;
 try{
  const res=await fetch(`${API}${path}`,{...options,method,signal:options.signal||controller.signal,headers:{...(isForm?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.headers||{})}});
  const body=res.status===204?{}:await res.json().catch(()=>({}));
  if(res.status===401){window.dispatchEvent(new CustomEvent('opsynq:unauthorized'));const err=new Error(body.message||'Your session has expired. Please sign in again.');err.status=401;throw err;}
  if(res.status===403){window.dispatchEvent(new CustomEvent('opsynq:forbidden',{detail:{message:body.message||'You do not have permission for this action.'}}));const err=new Error(body.message||'You do not have permission for this action.');err.status=403;throw err;}
  if(!res.ok){const err=new Error(body.message||`Request failed (${res.status}).`);err.status=res.status;throw err;}
  if(method==='GET')cacheResponse(cacheKey,body);
  return body;
 }catch(e){
  if(e.status)throw e;
  const offline=!navigator.onLine||e.name==='AbortError'||e instanceof TypeError;
  if(offline&&method==='GET'){const cached=await getCachedResponse(cacheKey);if(cached){window.dispatchEvent(new CustomEvent('opsynq:offline-cache'));return cached.data;}}
  if(offline&&['POST','PUT','PATCH','DELETE'].includes(method)&&!path.includes('/auth/')){await queueWrite({path,method,body:options.body,headers:options.headers||{}});return {queued:true,offline:true,message:'Saved offline. It will sync automatically when the connection returns.'};}
  if(e.name==='AbortError')throw new Error('Request timed out. Check your connection and try again.');throw e;
 }finally{clearTimeout(timeout)}
};
const scoped=(base,companyId,path)=>`${base}${path}${companyId?`${path.includes('?')?'&':'?'}companyId=${companyId}`:''}`;
export const opPath=(companyId,path)=>scoped('/api/platform/operations',companyId,path);
export const invPath=(companyId,path)=>scoped('/api/platform/inventory',companyId,path);
export const logPath=(companyId,path)=>scoped('/api/platform/logistics',companyId,path);
export const servicePath=(companyId,path)=>scoped('/api/platform/service',companyId,path);
export const govPath=(companyId,path)=>scoped('/api/platform/governance',companyId,path);
export const assurancePath=(companyId,path)=>scoped('/api/platform/assurance',companyId,path);
export const automationPath=(companyId,path)=>scoped('/api/platform/automation',companyId,path);

export const teamPath=(companyId,path='')=>scoped('/api/platform/team',companyId,path);

export const regulatoryPath=(companyId,path='')=>scoped('/api/platform/regulatory',companyId,path);

export const intelligencePath=(companyId,path='')=>scoped('/api/platform/intelligence',companyId,path);

export const aiPath=(companyId,path='')=>scoped('/api/platform/ai',companyId,path);
