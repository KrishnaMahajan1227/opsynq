const DB_NAME='opsynq-agency-resilience';
const DB_VERSION=2;
const QUEUE='writeQueue';
const CACHE='responseCache';
const DRAFTS='fieldDrafts';
function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(QUEUE))db.createObjectStore(QUEUE,{keyPath:'id',autoIncrement:true});if(!db.objectStoreNames.contains(CACHE))db.createObjectStore(CACHE,{keyPath:'key'});if(!db.objectStoreNames.contains(DRAFTS))db.createObjectStore(DRAFTS,{keyPath:'key'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function tx(store,mode,work){const db=await openDb();return new Promise((resolve,reject)=>{const t=db.transaction(store,mode),s=t.objectStore(store);let r;try{r=work(s)}catch(e){reject(e);return}t.oncomplete=()=>resolve(r?.result??r);t.onerror=()=>reject(t.error);});}
export async function cacheResponse(key,data){try{await tx(CACHE,'readwrite',s=>s.put({key,data,updatedAt:Date.now()}))}catch{}}
export async function getCachedResponse(key){try{return await tx(CACHE,'readonly',s=>s.get(key))}catch{return null}}
function serialiseBody(body){if(body==null)return {kind:'empty',value:null};if(body instanceof FormData)return {kind:'form',value:Array.from(body.entries())};if(typeof body==='string')return {kind:'text',value:body};return {kind:'json',value:body};}
function restoreBody(body){if(!body||body.kind==='empty')return undefined;if(body.kind==='form'){const fd=new FormData();for(const [k,v] of body.value||[])fd.append(k,v);return fd;}if(body.kind==='json')return typeof body.value==='string'?body.value:JSON.stringify(body.value);return body.value;}
export async function saveFieldDraft(key,data){if(!key)return;try{await tx(DRAFTS,'readwrite',s=>s.put({key,data,updatedAt:Date.now()}));window.dispatchEvent(new Event('opsynq:agency-draft-state'));}catch{}}
export async function getFieldDraft(key){if(!key)return null;try{return await tx(DRAFTS,'readonly',s=>s.get(key))}catch{return null}}
export async function deleteFieldDraft(key){if(!key)return;try{await tx(DRAFTS,'readwrite',s=>s.delete(key));window.dispatchEvent(new Event('opsynq:agency-draft-state'));}catch{}}
export async function queueWrite(entry){await tx(QUEUE,'readwrite',s=>s.add({...entry,body:serialiseBody(entry.body),createdAt:Date.now()}));window.dispatchEvent(new Event('opsynq:agency-sync-state'));}
export async function queuedCount(){try{return await tx(QUEUE,'readonly',s=>s.count())||0}catch{return 0}}
async function allQueued(){try{return await tx(QUEUE,'readonly',s=>s.getAll())||[]}catch{return []}}
async function removeQueued(id){try{await tx(QUEUE,'readwrite',s=>s.delete(id))}catch{}}
export async function flushQueuedWrites(apiBase){if(!navigator.onLine)return {synced:0,pending:await queuedCount()};let synced=0;const token=localStorage.getItem('token');for(const item of await allQueued()){try{const body=restoreBody(item.body),isForm=body instanceof FormData;const res=await fetch(item.url.startsWith('http')?item.url:`${apiBase}${item.url}`,{credentials:'include',method:item.method,body,headers:{...(isForm?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{})}});if(res.status===401||res.status===403)break;if(!res.ok)continue;await removeQueued(item.id);if(item.draftKey)await deleteFieldDraft(item.draftKey);synced++;}catch{break}}const pending=await queuedCount();window.dispatchEvent(new Event('opsynq:agency-sync-state'));return {synced,pending};}
