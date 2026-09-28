const clean=(value)=>Array.isArray(value)?value.filter(Boolean):[];
const key=(type,scope)=>`opsynq.nav.${type}.v16.${scope||'global'}`;

export function readNavList(type,scope){
 try{return clean(JSON.parse(localStorage.getItem(key(type,scope))||'[]'))}catch{return []}
}
export function writeNavList(type,scope,value){
 const next=clean(value);
 localStorage.setItem(key(type,scope),JSON.stringify(next));
 window.dispatchEvent(new CustomEvent('opsynq:navigation-preferences',{detail:{type,scope,value:next}}));
 return next;
}
export function recordRecent(scope,moduleId,limit=8){
 if(!moduleId)return readNavList('recent',scope);
 const current=readNavList('recent',scope).filter(id=>id!==moduleId);
 return writeNavList('recent',scope,[moduleId,...current].slice(0,limit));
}
export function toggleFavorite(scope,moduleId){
 const current=readNavList('favorites',scope);
 return writeNavList('favorites',scope,current.includes(moduleId)?current.filter(id=>id!==moduleId):[...current,moduleId]);
}
