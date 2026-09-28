import axios from 'axios';
import {cacheResponse,getCachedResponse,queueWrite} from './offlineStore';
let installed=false;
export function installAgencyAxiosResilience(){
 if(installed)return;installed=true;
 axios.interceptors.response.use(async response=>{const method=String(response.config?.method||'get').toUpperCase();if(method==='GET')cacheResponse(`GET:${response.config.url}`,response.data);return response;},async error=>{
  const cfg=error.config||{},method=String(cfg.method||'get').toUpperCase(),url=cfg.url||'';
  if(error.response)return Promise.reject(error);
  const offline=!navigator.onLine||error.code==='ERR_NETWORK'||error.code==='ECONNABORTED';
  if(!offline)return Promise.reject(error);
  if(method==='GET'){const cached=await getCachedResponse(`GET:${url}`);if(cached)return {data:cached.data,status:200,statusText:'Offline cache',headers:{},config:cfg,offlineCache:true};}
  if(['POST','PUT','PATCH','DELETE'].includes(method)&&!url.includes('/auth/')&&!url.includes('/unified-auth/')){await queueWrite({url,method,body:cfg.data});return {data:{queued:true,offline:true,message:'Saved offline. It will sync automatically when the connection returns.'},status:202,statusText:'Queued offline',headers:{},config:cfg};}
  return Promise.reject(error);
 });
}
