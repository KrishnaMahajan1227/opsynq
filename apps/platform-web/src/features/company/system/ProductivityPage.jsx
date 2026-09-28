import React,{useEffect,useMemo,useState}from'react';
import{Clock3,LayoutGrid,Pin,PinOff,Search}from'lucide-react';
import{PageHeader}from'../../../components/common';
import{flattenModulesForUser}from'../../../layout/moduleRegistry';
import{readNavList,recordRecent,toggleFavorite}from'../../../core/navigationPrefs';

const scopeFor=id=>`company:${id||'unknown'}`;

function ModuleCard({module,pinned,onOpen,onPin}){
 const Icon=module.icon;
 return <div className="productivity-module-card"><button className="productivity-open" onClick={()=>onOpen(module.id)}><span className="productivity-icon"><Icon size={18}/></span><span><b>{module.label}</b><small>{module.groupLabel}</small></span></button><button className={`pin-action ${pinned?'pinned':''}`} title={pinned?'Unpin module':'Pin module'} onClick={()=>onPin(module.id)}>{pinned?<PinOff size={15}/>:<Pin size={15}/>}</button></div>
}

export function MyWorkspacePage({companyId,onNavigate,user}){
 const scope=scopeFor(companyId),modules=useMemo(()=>flattenModulesForUser(user,true).filter(m=>m.id!=='my-workspace'),[user]);
 const[query,setQuery]=useState(''),[favorites,setFavorites]=useState(()=>readNavList('favorites',scope)),[recent,setRecent]=useState(()=>readNavList('recent',scope));
 useEffect(()=>{const sync=e=>{if(e.detail?.scope!==scope)return;if(e.detail.type==='favorites')setFavorites(e.detail.value||[]);if(e.detail.type==='recent')setRecent(e.detail.value||[])};window.addEventListener('opsynq:navigation-preferences',sync);return()=>window.removeEventListener('opsynq:navigation-preferences',sync)},[scope]);
 useEffect(()=>{setFavorites(readNavList('favorites',scope));setRecent(readNavList('recent',scope))},[scope]);
 const byId=useMemo(()=>Object.fromEntries(modules.map(m=>[m.id,m])),[modules]);
 const pinned=favorites.map(id=>byId[id]).filter(Boolean),recentModules=recent.map(id=>byId[id]).filter(Boolean),filtered=modules.filter(m=>`${m.label} ${m.groupLabel} ${m.keywords||''}`.toLowerCase().includes(query.toLowerCase()));
 const pin=id=>setFavorites(toggleFavorite(scope,id));
 const open=id=>{recordRecent(scope,id);onNavigate(id)};
 return <div className="productivity-page"><PageHeader eyebrow="PERSONAL WORKSPACE" title="My Workspace" text="Pin the modules you use most and jump back into recent work without searching through the full navigation."/>
  <div className="productivity-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find any company module…"/></div>
  <section className="productivity-section"><div className="productivity-heading"><span><Pin size={16}/><b>Pinned modules</b></span><small>{pinned.length} pinned</small></div>{pinned.length?<div className="productivity-grid">{pinned.map(m=><ModuleCard key={m.id} module={m} pinned onOpen={open} onPin={pin}/>)}</div>:<div className="productivity-empty">Pin frequently used modules from the module directory below. They stay available for this company on this browser.</div>}</section>
  <section className="productivity-section"><div className="productivity-heading"><span><Clock3 size={16}/><b>Recent modules</b></span><small>Last {recentModules.length}</small></div>{recentModules.length?<div className="productivity-grid">{recentModules.slice(0,8).map(m=><ModuleCard key={m.id} module={m} pinned={favorites.includes(m.id)} onOpen={open} onPin={pin}/>)}</div>:<div className="productivity-empty">Your recently opened modules will appear here automatically.</div>}</section>
  <section className="productivity-section"><div className="productivity-heading"><span><LayoutGrid size={16}/><b>Module directory</b></span><small>{filtered.length} modules</small></div><div className="productivity-grid">{filtered.map(m=><ModuleCard key={m.id} module={m} pinned={favorites.includes(m.id)} onOpen={open} onPin={pin}/>)}</div></section>
 </div>
}
