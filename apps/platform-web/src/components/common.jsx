import React from 'react';
import{Activity,ArrowLeft,ArrowRight,ArrowRightLeft,BarChart3,Bell,Boxes,Building2,Camera,CheckCircle2,CircleAlert,ClipboardCheck,FileSpreadsheet,FileText,History,Layers3,LockKeyhole,LogOut,MapPin,Menu,Navigation,PackageCheck,PackageOpen,PackagePlus,Plus,ScanLine,Search,ShieldCheck,ShoppingCart,SlidersHorizontal,Truck,UploadCloud,UserPlus,UsersRound,Warehouse,X,XCircle}from'lucide-react';
export const Status=({value})=><span className={`status status-${String(value||'').toLowerCase()}`}>{String(value||'Unknown').replaceAll('_',' ')}</span>;
export function Brand(){return <div className="brand"><span className="mark">O</span><div><b>Opsynq</b><small>GLOBAL OPERATIONS PLATFORM</small></div></div>}
export const PageHeader=({eyebrow='',title='',text='',actions=null,back=null})=>{
 const hasCopy=Boolean(eyebrow||title||text);
 if(!hasCopy&&actions)return <div className="screen-actionbar">{actions}</div>;
 if(!hasCopy&&!actions)return null;
 return <header className="screen-header">
  <div className="screen-header__copy">
   {back&&<button type="button" className="screen-back" onClick={back.onClick}><ArrowLeft size={15}/><span>{back.label||'Back'}</span></button>}
   {eyebrow&&<span className="screen-eyebrow">{eyebrow}</span>}
   {title&&<h1>{title}</h1>}
   {text&&<p>{text}</p>}
  </div>
  {actions&&<div className="screen-header__actions">{actions}</div>}
 </header>;
};
export function Modal({title,close,children,size='md'}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()} role="presentation"><div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><div><h2>{title}</h2></div><button type="button" className="icon-btn" onClick={close} aria-label="Close"><X/></button></div><div className="modal-body-scroll">{children}</div></div></div>}
export function FilterDrawer({open,title='Filters',subtitle='Refine the records shown in this workspace.',close,children,onReset}){if(!open)return null;return <><button className="filter-drawer-backdrop" aria-label="Close filters" onClick={close}/><aside className="filter-drawer" role="dialog" aria-modal="true" aria-label={title}><div className="filter-drawer__header"><div><SlidersHorizontal size={17}/><span><b>{title}</b><small>{subtitle}</small></span></div><button className="icon-btn" onClick={close} aria-label="Close filters"><X size={18}/></button></div><div className="filter-drawer__body">{children}</div><div className="filter-drawer__footer">{onReset&&<button className="btn secondary" onClick={onReset}>Reset</button>}<button className="btn primary" onClick={close}>View results</button></div></aside></>}
export function FilterButton({onClick,count=0,label='Filters'}){return <button type="button" className="btn secondary filter-button" onClick={onClick}><SlidersHorizontal size={16}/><span>{label}</span>{count>0&&<em>{count}</em>}</button>}

export class AppErrorBoundary extends React.Component{
 constructor(props){super(props);this.state={error:null}}
 static getDerivedStateFromError(error){return{error}}
 componentDidCatch(error,info){console.error('Opsynq UI error',error,info)}
 render(){if(this.state.error)return <div className="fatal-state"><div className="fatal-card"><div className="mark">O</div><h1>Something went wrong</h1><p>The workspace hit an unexpected UI error. Your saved data has not been changed.</p><small>{this.state.error?.message||'Unexpected application error'}</small><div className="modal-actions"><button className="btn secondary" onClick={()=>this.setState({error:null})}>Try again</button><button className="btn primary" onClick={()=>location.reload()}>Reload workspace</button></div></div></div>;return this.props.children}
}

export function DetailDrawer({open,title,subtitle='',close,children,actions=null}){if(!open)return null;return <><button className="detail-drawer-backdrop" aria-label="Close details" onClick={close}/><aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={title}><div className="detail-drawer__head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-btn" onClick={close} aria-label="Close details"><X size={18}/></button></div><div className="detail-drawer__body">{children}</div>{actions&&<div className="detail-drawer__foot">{actions}</div>}</aside></>}
export function InfoGrid({items=[]}){return <div className="info-grid">{items.filter(x=>x&&x.label).map((x,i)=><div key={`${x.label}-${i}`} className={x.wide?'wide':''}><small>{x.label}</small><b>{x.value===undefined||x.value===null||x.value===''?'—':String(x.value)}</b></div>)}</div>}

const prettyLabel=(key='')=>String(key).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/^./,m=>m.toUpperCase());
const detailValue=value=>{if(value===undefined||value===null||value==='')return '—';if(value instanceof Date)return value.toLocaleString();if(typeof value==='boolean')return value?'Yes':'No';if(typeof value==='number')return new Intl.NumberFormat().format(value);if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(value)){const d=new Date(value);if(!Number.isNaN(d.getTime()))return d.toLocaleString()}return String(value)};
export function SmartRecordDetails({record,exclude=[]}){if(!record)return null;const hidden=new Set(['__v',...exclude]);const primary=[],nested=[];Object.entries(record).forEach(([key,value])=>{if(hidden.has(key)||key==='_id'||key==='createdAt'||key==='updatedAt')return;if(value&&typeof value==='object'&&!Array.isArray(value))nested.push([key,value]);else if(Array.isArray(value)){if(value.length)nested.push([key,value]);}else primary.push({label:prettyLabel(key),value:detailValue(value)});});return <><div className="detail-section"><h3>Complete record</h3><InfoGrid items={primary}/></div>{nested.map(([key,value])=><div className="detail-section" key={key}><h3>{prettyLabel(key)}</h3>{Array.isArray(value)?<div className="detail-list">{value.map((row,i)=><div className="detail-list-row" key={row?._id||i}>{row&&typeof row==='object'?<InfoGrid items={Object.entries(row).filter(([k])=>!['_id','__v'].includes(k)).map(([k,v])=>({label:prettyLabel(k),value:typeof v==='object'?JSON.stringify(v):detailValue(v)}))}/>:<b>{detailValue(row)}</b>}</div>)}</div>:<InfoGrid items={Object.entries(value).filter(([k])=>!['_id','__v'].includes(k)).map(([k,v])=>({label:prettyLabel(k),value:typeof v==='object'?JSON.stringify(v):detailValue(v)}))}/>}</div>)}<div className="detail-section"><h3>Record identity</h3><InfoGrid items={[{label:'Created',value:record.createdAt?new Date(record.createdAt).toLocaleString():'—'},{label:'Last updated',value:record.updatedAt?new Date(record.updatedAt).toLocaleString():'—'},{label:'Record ID',value:record._id||'—',wide:true}]}/></div></>}


export function BeneficiaryLink({farmerId,children,className=''}){if(!farmerId)return <span className={className}>{children}</span>;return <button type="button" className={`beneficiary-link ${className}`.trim()} onClick={e=>{e.stopPropagation();window.dispatchEvent(new CustomEvent('opsynq:open-beneficiary',{detail:{farmerId:String(farmerId)}}))}}>{children}</button>}

export function MediaGrid({items=[]}){const rows=items.filter(Boolean);if(!rows.length)return <div className="detail-empty">No media attached.</div>;return <div className="media-grid">{rows.map((src,i)=><a key={`${src}-${i}`} href={src} target="_blank" rel="noreferrer"><img src={src} alt={`Evidence ${i+1}`}/><span>Open image</span></a>)}</div>}
