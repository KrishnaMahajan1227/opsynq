import React,{useEffect,useState}from'react';
import{Bookmark,Plus,Trash2}from'lucide-react';
import{deleteView,readSavedViews,saveView}from'../core/savedViews';
export function SavedViews({scope,moduleId,state,onApply}){
 const[views,setViews]=useState(()=>readSavedViews(scope,moduleId));
 useEffect(()=>{setViews(readSavedViews(scope,moduleId))},[scope,moduleId]);
 const add=()=>{const name=window.prompt('Name this view:');if(!name?.trim())return;setViews(saveView(scope,moduleId,name,state))};
 const remove=(e,id)=>{e.stopPropagation();setViews(deleteView(scope,moduleId,id))};
 return <div className="saved-views"><button className="saved-view-add" type="button" onClick={add} title="Save current search/filter view"><Plus size={14}/><span>Save view</span></button>{views.slice(0,5).map(v=><button className="saved-view" type="button" key={v.id} onClick={()=>onApply(v.state)} title={`Apply ${v.name}`}><Bookmark size={13}/><span>{v.name}</span><i onClick={e=>remove(e,v.id)} role="button" aria-label={`Delete ${v.name}`}><Trash2 size={12}/></i></button>)}</div>
}
