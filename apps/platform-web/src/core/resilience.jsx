import React,{useEffect,useRef,useState} from 'react';
import {CloudOff,RefreshCw,Wifi} from 'lucide-react';
import {API,tokenKey} from './api';
import {flushQueuedWrites,queuedCount} from './offlineStore';

const STATE_KEY='opsynq_continuity_state';
export function saveContinuityState(extra={}){try{sessionStorage.setItem(STATE_KEY,JSON.stringify({path:location.pathname,search:location.search,scrollY:window.scrollY,at:Date.now(),...extra}))}catch{}}
export function restoreContinuityScroll(){try{const s=JSON.parse(sessionStorage.getItem(STATE_KEY)||'{}');if(Number.isFinite(s.scrollY))requestAnimationFrame(()=>window.scrollTo({top:s.scrollY,behavior:'auto'}));}catch{}}
function unsafeToReload(){const el=document.activeElement;const editing=el&&(['INPUT','TEXTAREA','SELECT'].includes(el.tagName)||el.isContentEditable);const modal=document.querySelector('.modal.show,.modal-shell,.dialog-backdrop,.filter-drawer.open,[role="dialog"]');return Boolean(editing||modal);}
export function safeReload(reason='update'){
 saveContinuityState({reason});
 const attempt=()=>{if(unsafeToReload()){setTimeout(attempt,1500);return}location.reload();};attempt();
}
export function ResilienceStatus(){
 const[online,setOnline]=useState(navigator.onLine);const[pending,setPending]=useState(0);const[syncing,setSyncing]=useState(false);const revision=useRef('');const shellFingerprint=useRef('');const syncInFlight=useRef(false);const retryTimer=useRef(null);
 useEffect(()=>{let live=true;
  const refreshCount=async()=>{const n=await queuedCount();if(live)setPending(n);return n};
  const sync=async()=>{if(syncInFlight.current||!navigator.onLine)return;const n=await refreshCount();if(!n){if(live){setOnline(true);setSyncing(false)}return}syncInFlight.current=true;if(live){setOnline(true);setSyncing(true)}try{const r=await flushQueuedWrites({apiBase:API,token:localStorage.getItem(tokenKey)});if(live)setPending(r.pending);if(r.synced>0)window.dispatchEvent(new CustomEvent('opsynq:data-refresh',{detail:r}));}finally{syncInFlight.current=false;if(live)setSyncing(false)}};
  const scheduleSync=(delay=900)=>{clearTimeout(retryTimer.current);retryTimer.current=setTimeout(()=>{if(live&&navigator.onLine)sync()},delay)};
  const onOnline=()=>{setOnline(true);scheduleSync(100)};
  const onOffline=()=>{clearTimeout(retryTimer.current);setOnline(false);setSyncing(false)};
  const onSyncState=async event=>{const n=await refreshCount();if(n>0&&navigator.onLine&&!event.detail)scheduleSync()};
  const onFocus=()=>{if(navigator.onLine)scheduleSync(150)};
  const onVisibility=()=>{if(document.visibilityState==='visible'&&navigator.onLine)scheduleSync(150)};
  refreshCount().then(n=>{if(n>0&&navigator.onLine)scheduleSync(120)});
  window.addEventListener('online',onOnline);window.addEventListener('offline',onOffline);window.addEventListener('focus',onFocus);window.addEventListener('opsynq:sync-state',onSyncState);document.addEventListener('visibilitychange',onVisibility);
  return()=>{live=false;clearTimeout(retryTimer.current);window.removeEventListener('online',onOnline);window.removeEventListener('offline',onOffline);window.removeEventListener('focus',onFocus);window.removeEventListener('opsynq:sync-state',onSyncState);document.removeEventListener('visibilitychange',onVisibility)}
 },[]);
 useEffect(()=>{if(import.meta.env.DEV)return;let live=true;const check=async()=>{try{const [runtime,shell]=await Promise.all([fetch(`${API}/api/runtime/revision`,{cache:'no-store'}),fetch(`${location.origin}/index.html?opsynq_revision=${Date.now()}`,{cache:'no-store'})]);if(runtime.ok){const d=await runtime.json();if(!revision.current)revision.current=d.revision;else if(live&&d.revision&&d.revision!==revision.current)return safeReload('runtime-update');}if(shell.ok){const html=await shell.text();const fp=`${html.length}:${html.slice(0,512)}:${html.slice(-512)}`;if(!shellFingerprint.current)shellFingerprint.current=fp;else if(live&&fp!==shellFingerprint.current)safeReload('frontend-deployment');}}catch{}};check();const id=setInterval(check,12000);return()=>{live=false;clearInterval(id)}},[]);
 useEffect(()=>{const refresh=()=>safeReload('offline-sync');window.addEventListener('opsynq:data-refresh',refresh);restoreContinuityScroll();return()=>window.removeEventListener('opsynq:data-refresh',refresh)},[]);
 if(online&&!pending&&!syncing)return null;
 return <div className={`resilience-bar ${online?'syncing':'offline'}`}>{online?<RefreshCw size={14} className={syncing?'spin':''}/>:<CloudOff size={14}/>}<span>{online?(syncing?'Syncing saved changes…':`${pending} change${pending===1?'':'s'} waiting to sync`):`Offline — ${pending?`${pending} change${pending===1?'':'s'} safely queued`:'cached data remains available'}`}</span>{online&&!syncing&&<Wifi size={14}/>}</div>;
}
