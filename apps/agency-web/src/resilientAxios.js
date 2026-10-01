import axios from 'axios';
import {cacheResponse,getCachedResponse,queueWrite} from './offlineStore';
let installed=false;
const inflightGets=new Map();
const memoryGets=new Map();
const MEMORY_TTL=12000;

const actorKey=()=>`${localStorage.getItem('organizationId')||localStorage.getItem('agencyId')||'agency'}:${localStorage.getItem('userId')||localStorage.getItem('username')||'user'}`;
export const agencyGetCacheKey=url=>`GET:${actorKey()}:${url}`;
export async function getAgencyCached(url,{maxAge=30*60*1000}={}){
 const cached=await getCachedResponse(agencyGetCacheKey(url));
 return cached&&Date.now()-Number(cached.updatedAt||0)<=maxAge?cached:null;
}

export function installAgencyAxiosResilience(){
 if(installed)return;installed=true;axios.defaults.withCredentials=true;
 const rawGet=axios.get.bind(axios),rawPost=axios.post.bind(axios),rawPut=axios.put.bind(axios),rawPatch=axios.patch.bind(axios),rawDelete=axios.delete.bind(axios);
 axios.get=(url,config={})=>{
  if(config?.responseType||config?.opsynqNoCache)return rawGet(url,config);
  const key=agencyGetCacheKey(url),hit=memoryGets.get(key);
  if(hit&&Date.now()-hit.at<MEMORY_TTL)return Promise.resolve(hit.response);
  if(inflightGets.has(key))return inflightGets.get(key);
  const req=rawGet(url,config).then(response=>{memoryGets.set(key,{at:Date.now(),response});return response;});
  inflightGets.set(key,req);req.then(()=>inflightGets.delete(key),()=>inflightGets.delete(key));return req;
 };
 const wrapWrite=fn=>(...args)=>fn(...args).then(response=>{memoryGets.clear();return response;});
 axios.post=wrapWrite(rawPost);axios.put=wrapWrite(rawPut);axios.patch=wrapWrite(rawPatch);axios.delete=wrapWrite(rawDelete);
 axios.interceptors.response.use(async response=>{const method=String(response.config?.method||'get').toUpperCase();if(method==='GET'&&!response.config?.responseType)cacheResponse(agencyGetCacheKey(response.config.url),response.data);return response;},async error=>{
  const cfg=error.config||{},method=String(cfg.method||'get').toUpperCase(),url=cfg.url||'';
  if(error.response)return Promise.reject(error);
  const offline=!navigator.onLine||error.code==='ERR_NETWORK'||error.code==='ECONNABORTED';
  if(!offline)return Promise.reject(error);
  if(method==='GET'){const cached=await getCachedResponse(agencyGetCacheKey(url));if(cached)return {data:cached.data,status:200,statusText:'Offline cache',headers:{},config:cfg,offlineCache:true};}
  if(['POST','PUT','PATCH','DELETE'].includes(method)&&!url.includes('/auth/')&&!url.includes('/unified-auth/')){await queueWrite({url,method,body:cfg.data,draftKey:cfg.opsynqDraftKey||''});return {data:{queued:true,offline:true,message:'Saved offline. It will sync automatically when the connection returns.'},status:202,statusText:'Queued offline',headers:{},config:cfg};}
  return Promise.reject(error);
 });
}
