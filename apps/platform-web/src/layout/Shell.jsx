import React,{useEffect,useMemo,useRef,useState}from'react';
import{Bell,Check,ChevronDown,ChevronRight,Command,LogOut,Menu,PanelLeftClose,PanelLeftOpen,Search,X}from'lucide-react';
import {Brand} from '../components/common';
import {api} from '../core/api';
import {flattenModulesForUser,moduleForPage,groupsForUser} from './moduleRegistry';
import {recordRecent} from '../core/navigationPrefs';

const storageKey=mode=>`opsynq.sidebar.groups.v16.${mode?'company':'platform'}`;
const compactKey='opsynq.sidebar.compact.v16';

function CommandPalette({open,onClose,modules,onSelect}){
 const[q,setQ]=useState(''),input=useRef(null);
 useEffect(()=>{if(open){setQ('');const id=setTimeout(()=>input.current?.focus(),20);return()=>clearTimeout(id)}},[open]);
 if(!open)return null;
 const list=modules.filter(m=>`${m.label} ${m.groupLabel} ${m.keywords||''}`.toLowerCase().includes(q.toLowerCase()));
 return <div className="command-overlay" onMouseDown={onClose}><div className="command-palette" onMouseDown={e=>e.stopPropagation()}><div className="command-search"><Search size={18}/><input ref={input} value={q} onChange={e=>setQ(e.target.value)} placeholder="Go to any module…"/><kbd>Esc</kbd></div><div className="command-results">{list.map(m=><button key={m.id} onClick={()=>{onSelect(m.id);onClose()}}><m.icon size={18}/><span><b>{m.label}</b><small>{m.groupLabel}</small></span></button>)}{!list.length&&<div className="nav-empty">No matching module</div>}</div></div></div>
}


function NotificationBell({companyId,onNavigate}){
 const[open,setOpen]=useState(false),[pinned,setPinned]=useState(false),[items,setItems]=useState([]),[unread,setUnread]=useState(0),[loading,setLoading]=useState(false),hoverTimer=useRef();
 const load=async()=>{if(!companyId)return;setLoading(true);try{const d=await api(`/api/platform/governance/notifications?companyId=${companyId}`);setItems((d.items||[]).slice(0,20));setUnread(Number(d.unread||0))}catch{}finally{setLoading(false)}};
 useEffect(()=>{if(!companyId)return;load();const id=setInterval(load,45000);return()=>{clearInterval(id);clearTimeout(hoverTimer.current)}},[companyId]);
 const close=()=>{setOpen(false);setPinned(false)};
 const mark=async n=>{if(!n.isRead){try{await api(`/api/platform/governance/notifications/${n._id}/read?companyId=${companyId}`,{method:'PATCH'});setItems(v=>v.map(x=>x._id===n._id?{...x,isRead:true}:x));setUnread(v=>Math.max(0,v-1))}catch{}}if(n.actionUrl){const target=String(n.actionUrl).replace(/^.*page=/,'').replace(/^\//,'');if(target)onNavigate(target)}close()};
 const enter=()=>{clearTimeout(hoverTimer.current);hoverTimer.current=setTimeout(()=>{setOpen(true);load()},120)};
 const leave=()=>{clearTimeout(hoverTimer.current);if(!pinned)hoverTimer.current=setTimeout(()=>setOpen(false),220)};
 const bellLabel=unread?`Notifications, ${unread} unread`:'Notifications';
 return <div className="notification-center" onMouseEnter={enter} onMouseLeave={leave}>
  <button className="notification-bell" onClick={()=>{const next=!pinned;setPinned(next);setOpen(next);if(next)load()}} aria-label={bellLabel}><Bell size={18}/>{unread>0&&<span>{unread>99?'99+':unread}</span>}</button>
  {open&&<div className="notification-popover" role="dialog" aria-label="Notifications preview">
   <div className="notification-popover-head"><div><b>Notifications</b><small>{unread?`${unread} unread`:'You are up to date'}</small></div><button className="icon-btn" onClick={close}><X size={16}/></button></div>
   <div className="notification-popover-body">
    {loading&&!items.length?<div className="nav-empty">Loading notifications…</div>:items.slice(0,6).map(n=><button key={n._id} className={`notification-item ${n.isRead?'':'unread'}`} onClick={()=>mark(n)}><i></i><span><b>{n.title}</b><small>{n.message}</small><em>{new Date(n.createdAt).toLocaleString()}</em></span>{n.isRead&&<Check size={14}/>}</button>)}
    {!loading&&!items.length&&<div className="nav-empty">No notifications for your role.</div>}
   </div>
   <button className="notification-all" onClick={()=>{onNavigate('notifications');close()}}>Open notification center</button>
  </div>}
 </div>
}

function GlobalSearch({companyId,onNavigate,allowedPages=null}){
 const[q,setQ]=useState(''),[open,setOpen]=useState(false),[loading,setLoading]=useState(false),[results,setResults]=useState([]),timer=useRef();
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const search=value=>{setQ(value);clearTimeout(timer.current);if(value.trim().length<2){setResults([]);setOpen(false);return}timer.current=setTimeout(async()=>{setLoading(true);try{const qs=new URLSearchParams({q:value.trim()});if(companyId)qs.set('companyId',companyId);const d=await api(`/api/platform/search?${qs}`);setResults((d.results||[]).filter(r=>!allowedPages||allowedPages.has(r.page)));setOpen(true)}catch{setResults([])}finally{setLoading(false)}},260)};
 return <div className="global-search"><Search size={16}/><input value={q} onChange={e=>search(e.target.value)} onFocus={()=>q.length>1&&setOpen(true)} placeholder="Search records…"/><span className="search-state">{loading?'…':'⌘'}</span>{open&&<div className="global-results"><div className="global-results-head"><b>Search results</b><button onClick={()=>setOpen(false)}><X size={15}/></button></div>{results.map((r,i)=><button key={`${r.type}-${r.id}-${i}`} onClick={()=>{onNavigate(r.page);setOpen(false)}}><span className="result-type">{r.type}</span><span><b>{r.title}</b><small>{r.subtitle}</small></span></button>)}{!loading&&!results.length&&<div className="nav-empty">No matching records</div>}</div>}</div>
}

export function Shell({user,page,setPage,logout,companyMode=false,companyId=null,children}){
 const[apiState,setApiState]=useState('checking'),[permissionNotice,setPermissionNotice]=useState('');
 useEffect(()=>{const forbidden=e=>{setPermissionNotice(e.detail?.message||'You do not have permission for this action.');const id=setTimeout(()=>setPermissionNotice(''),4200);return()=>clearTimeout(id)};window.addEventListener('opsynq:forbidden',forbidden);return()=>window.removeEventListener('opsynq:forbidden',forbidden)},[]);
 useEffect(()=>{let live=true;const check=()=>fetch(`${(String(import.meta.env.VITE_API_URL||'').replace(/\/$/,'')||(import.meta.env.PROD?'':'http://localhost:3000'))}/api/health/ready`).then(r=>{if(live)setApiState(r.ok?'ready':'attention')}).catch(()=>{if(live)setApiState('offline')});check();const id=setInterval(check,30000);return()=>{live=false;clearInterval(id)}},[]);
 const groups=useMemo(()=>groupsForUser(user,companyMode),[user,companyMode]),modules=useMemo(()=>flattenModulesForUser(user,companyMode),[user,companyMode]);
 const searchAllowedPages=useMemo(()=>companyMode?new Set([...modules.map(m=>m.id),'contracts','work-orders','work-packages']):null,[modules,companyMode]);
 const[compact,setCompact]=useState(()=>localStorage.getItem(compactKey)==='1'),[navQuery,setNavQuery]=useState(''),[palette,setPalette]=useState(false),[mobileOpen,setMobileOpen]=useState(false),[navTrail,setNavTrail]=useState([]);
 const initialGroups=()=>Object.fromEntries(groups.map((g,i)=>[g.id,i===0]));
 const[openGroups,setOpenGroups]=useState(()=>{try{return {...initialGroups(),...(JSON.parse(localStorage.getItem(storageKey(companyMode)))||{})}}catch{return initialGroups()}});
 const current=moduleForPage(page,companyMode);
 const navActivePage=companyMode&&['contracts','work-orders','work-packages'].includes(page)?'programs':page;
 const trailKey=`opsynq.nav.trail.${companyMode?'company':'platform'}.${companyId||'global'}`;
 useEffect(()=>{let existing=[];try{existing=JSON.parse(sessionStorage.getItem(trailKey)||'[]')}catch{}const next=[...existing.filter(id=>id!==page),page].slice(-4);setNavTrail(next);try{sessionStorage.setItem(trailKey,JSON.stringify(next))}catch{}},[page,trailKey]);
 useEffect(()=>{if(current){const activeGroup=['contracts','work-orders','work-packages'].includes(page)?'delivery':current.groupId;setOpenGroups(Object.fromEntries(groups.map(g=>[g.id,g.id===activeGroup])))}else if(modules.length&&page!==modules[0].id)setPage(modules[0].id)},[page,companyMode,user]);
 useEffect(()=>{localStorage.setItem(storageKey(companyMode),JSON.stringify(openGroups))},[openGroups,companyMode]);
 useEffect(()=>{localStorage.setItem(compactKey,compact?'1':'0')},[compact]);
 useEffect(()=>{const key=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPalette(true)}if(e.key==='Escape'){setPalette(false);setMobileOpen(false)}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[]);
 const visibleGroups=groups.map(g=>({...g,items:g.items.filter(m=>`${m.label} ${m.keywords||''}`.toLowerCase().includes(navQuery.toLowerCase()))})).filter(g=>g.items.length);
 const go=id=>{if(companyMode&&companyId)recordRecent(`company:${companyId}`,id);setPage(id);setNavQuery('');setMobileOpen(false)};

 return <div className={`app-shell ${compact?'compact':''} ${mobileOpen?'mobile-nav-open':''}`}>
  {compact&&<button className="sidebar-expand-handle" aria-label="Expand sidebar navigation" title="Expand navigation" onClick={()=>setCompact(false)}><PanelLeftOpen size={17}/></button>}
  {mobileOpen&&<button className="sidebar-backdrop" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}
  <aside className="sidebar">
   <div className="side-brand"><Brand/><button className="icon-btn sidebar-toggle" aria-label={compact?'Expand navigation':'Collapse navigation'} onClick={()=>setCompact(v=>!v)}>{compact?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button><button className="icon-btn sidebar-mobile-close" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>
   {!compact&&<div className="nav-workspace-label"><span>{companyMode?'Company workspace':'Platform workspace'}</span><small>{String(user?.role||'').replaceAll('_',' ')}</small></div>}
   <div className="side-search"><Search size={15}/><input value={navQuery} onChange={e=>setNavQuery(e.target.value)} placeholder="Find module…" aria-label="Find module"/>{navQuery&&<button onClick={()=>setNavQuery('')} aria-label="Clear module search"><X size={14}/></button>}</div>

   <nav className="nav-groups" aria-label="Main modules">{visibleGroups.map(g=>{const expanded=navQuery?true:openGroups[g.id]!==false;const active=g.items.some(m=>m.id===navActivePage);const toggleGroup=()=>{if(compact){setCompact(false);setOpenGroups(Object.fromEntries(groups.map(x=>[x.id,x.id===g.id])));return}setOpenGroups(Object.fromEntries(groups.map(x=>[x.id,x.id===g.id?!expanded:false])))};return <section className={`nav-group ${active?'has-active':''}`} key={g.id}><button className="nav-group-toggle" onClick={toggleGroup} title={compact?g.label:undefined} aria-expanded={compact?false:expanded}><span className="group-copy">{g.icon&&<g.icon size={16}/>}<b>{g.label}</b></span>{!compact&&<span className="group-meta"><ChevronDown size={14} className={expanded?'rotated':''}/></span>}</button>{!compact&&expanded&&<div className="nav-group-items">{g.items.map(m=><button key={m.id} className={navActivePage===m.id?'active':''} onClick={()=>go(m.id)}><m.icon size={17}/><span>{m.label}</span>{navActivePage===m.id&&<i className="active-dot"/>}</button>)}</div>}</section>})}{!visibleGroups.length&&<div className="nav-empty">No module found</div>}</nav>
   <div className="user-card"><span className="avatar">{user?.name?.[0]?.toUpperCase()||'O'}</span><div><b>{user?.name}</b><small>{user?.role?.replaceAll('_',' ')}</small></div></div>
   <button className="logout" onClick={logout}><LogOut size={18}/><span>Sign out</span></button>
  </aside>
  <main className="workspace">
   <div className="workspace-tools"><button className="mobile-nav-trigger" onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu size={18}/><span>Menu</span></button><span className={`api-state api-${apiState}`} title="Backend readiness"><i></i>{apiState==='ready'?'System ready':apiState==='checking'?'Checking system…':apiState==='offline'?'API offline':'System attention'}</span><GlobalSearch companyId={companyId} onNavigate={go} allowedPages={searchAllowedPages}/>{companyMode&&companyId&&<NotificationBell companyId={companyId} onNavigate={go}/>}<button className="module-switch" onClick={()=>setPalette(true)}><Menu size={16}/> All modules</button></div>
   {companyMode&&navTrail.length>0&&<div className="workspace-breadcrumbs" aria-label="Recent navigation"><span>Workspace</span>{navTrail.map((id,i)=>{const m=moduleForPage(id,companyMode);if(!m)return null;return <React.Fragment key={`${id}-${i}`}><ChevronRight size={12}/><button className={id===page?'active':''} onClick={()=>id!==page&&go(id)}>{m.label}</button></React.Fragment>})}</div>}
   {permissionNotice&&<div className="permission-toast">{permissionNotice}</div>}
   {children}
  </main>
  <CommandPalette open={palette} onClose={()=>setPalette(false)} modules={modules} onSelect={go}/>
 </div>
}
