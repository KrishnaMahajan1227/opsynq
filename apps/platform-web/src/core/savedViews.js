const key=(scope,moduleId)=>`opsynq.savedviews.v17.${scope}.${moduleId}`;
const parse=value=>{try{return JSON.parse(value||'[]')}catch{return[]}};
export function readSavedViews(scope,moduleId){return parse(localStorage.getItem(key(scope,moduleId))).filter(x=>x&&x.id&&x.name)}
export function saveView(scope,moduleId,name,state){const current=readSavedViews(scope,moduleId);const item={id:`view-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:String(name||'').trim(),state,createdAt:new Date().toISOString()};const next=[item,...current].slice(0,12);localStorage.setItem(key(scope,moduleId),JSON.stringify(next));window.dispatchEvent(new CustomEvent('opsynq:saved-views',{detail:{scope,moduleId}}));return next}
export function deleteView(scope,moduleId,id){const next=readSavedViews(scope,moduleId).filter(x=>x.id!==id);localStorage.setItem(key(scope,moduleId),JSON.stringify(next));window.dispatchEvent(new CustomEvent('opsynq:saved-views',{detail:{scope,moduleId}}));return next}
