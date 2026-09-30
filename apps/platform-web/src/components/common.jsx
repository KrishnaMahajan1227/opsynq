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

export function ConfirmDialog({open,title='Confirm action',message='',confirmLabel='Confirm',cancelLabel='Cancel',tone='primary',requireReason=false,reasonLabel='Reason / note',reasonPlaceholder='Add a short reason for the audit trail…',busy=false,onCancel,onConfirm}){
 const[reason,setReason]=React.useState('');
 React.useEffect(()=>{if(open)setReason('')},[open]);
 if(!open)return null;
 const disabled=busy||(requireReason&&!reason.trim());
 return <Modal title={title} close={()=>!busy&&onCancel?.()} size="sm"><div className="confirm-panel"><p>{message}</p>{requireReason&&<label>{reasonLabel}<textarea rows="3" value={reason} onChange={e=>setReason(e.target.value)} placeholder={reasonPlaceholder} autoFocus/></label>}<div className="modal-actions"><button type="button" className="btn secondary" disabled={busy} onClick={()=>onCancel?.()}>{cancelLabel}</button><button type="button" className={`btn ${tone==='danger'?'danger':'primary'}`} disabled={disabled} onClick={()=>onConfirm?.({reason:reason.trim()})}>{busy?'Working…':confirmLabel}</button></div></div></Modal>
}

export function useConfirmAction(){
 const[state,setState]=React.useState(null);
 const ask=React.useCallback(options=>new Promise(resolve=>setState({...options,resolve})),[]);
 const close=React.useCallback(result=>{setState(current=>{current?.resolve?.(result);return null})},[]);
 const dialog=<ConfirmDialog open={!!state} {...(state||{})} onCancel={()=>close({confirmed:false,reason:''})} onConfirm={({reason})=>close({confirmed:true,reason})}/>;
 return{ask,dialog};
}

const humanField=key=>String(key||'').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/^./,x=>x.toUpperCase());
const conflictValue=value=>{if(value===undefined||value===null||value==='')return '—';if(typeof value==='object')return JSON.stringify(value);return String(value)};
export function ConflictResolutionDialog({open,conflict,onCancel,onUpdate,onSkip,busy=false,title='Possible duplicate found'}){
 if(!open||!conflict)return null;const rows=conflict.differences||[];
 return <Modal title={title} close={()=>!busy&&onCancel?.()} size="lg"><div className="duplicate-review"><div className="duplicate-review__notice"><CircleAlert size={19}/><div><b>{conflict.entityType||'Record'} already exists</b><p>Review what is already saved and what the new entry is trying to change. Nothing is overwritten until you choose an action.</p></div></div><div className="duplicate-review__identity"><small>Matched by</small><b>{conflict.key||conflict.existingId||'Existing record'}</b></div>{rows.length?<div className="duplicate-diff-wrap"><table className="duplicate-diff"><thead><tr><th>Field</th><th>Existing</th><th>Incoming</th></tr></thead><tbody>{rows.map((row,i)=><tr key={`${row.field}-${i}`}><td>{humanField(row.field)}</td><td>{conflictValue(row.existing)}</td><td>{conflictValue(row.incoming)}</td></tr>)}</tbody></table></div>:<div className="duplicate-same">The incoming values match the existing record. You can safely skip this entry.</div>}<div className="duplicate-review__actions"><button type="button" className="btn secondary" disabled={busy} onClick={()=>onCancel?.()}>Go back</button><button type="button" className="btn secondary" disabled={busy} onClick={()=>onSkip?.()}>Skip new entry</button>{(conflict.allowedActions||[]).includes('UPDATE')&&<button type="button" className="btn primary" disabled={busy} onClick={()=>onUpdate?.()}>{busy?'Updating…':'Update existing record'}</button>}</div></div></Modal>
}

export function BulkDuplicateResolutionDialog({open,rows=[],decisions={},onChange,onApplyAll,onCancel,onConfirm,busy=false,title='Review duplicate records'}){
 if(!open)return null;
 return <Modal title={title} close={()=>!busy&&onCancel?.()} size="xl"><div className="bulk-duplicate-review"><div className="duplicate-review__notice"><CircleAlert size={19}/><div><b>{rows.length} existing record{rows.length===1?'':'s'} need a decision</b><p>Compare the incoming values with the current record. Choose Update or Skip per row, or apply one decision to all duplicates.</p></div></div><div className="bulk-duplicate-actions"><button type="button" className="btn secondary small" onClick={()=>onApplyAll?.('SKIP')}>Skip all</button><button type="button" className="btn secondary small" onClick={()=>onApplyAll?.('UPDATE')}>Update all</button></div><div className="bulk-duplicate-table"><table><thead><tr><th>Record</th><th>Changes detected</th><th>Decision</th></tr></thead><tbody>{rows.map((row,i)=>{const key=row.key||row.beneficiaryId||row.sku||String(i);const diffs=row.differences||[];return <tr key={key}><td><b>{row.label||row.key||row.beneficiaryId||row.sku||`Row ${i+1}`}</b><small>{row.subtitle||row.entityType||'Existing record'}</small></td><td>{diffs.length?<div className="bulk-diff-list">{diffs.slice(0,5).map(d=><span key={d.field}><b>{humanField(d.field)}</b><em>{conflictValue(d.existing)} → {conflictValue(d.incoming)}</em></span>)}{diffs.length>5&&<small>+{diffs.length-5} more changes</small>}</div>:<span className="duplicate-no-change">No field changes</span>}</td><td><select value={decisions[key]||'SKIP'} onChange={e=>onChange?.(key,e.target.value)}><option value="SKIP">Skip</option><option value="UPDATE">Update existing</option></select></td></tr>})}</tbody></table></div><div className="modal-actions"><button type="button" className="btn secondary" disabled={busy} onClick={()=>onCancel?.()}>Back</button><button type="button" className="btn primary" disabled={busy} onClick={()=>onConfirm?.()}>{busy?'Applying…':'Apply decisions & continue'}</button></div></div></Modal>
}

export function confirmAction({title='Confirm action',message='',confirmLabel='Confirm',cancelLabel='Cancel',tone='primary',requireReason=false,reasonLabel='Reason / note',defaultReason=''}){
 return new Promise(resolve=>{
  const root=document.createElement('div');root.className='opsynq-confirm-overlay';root.setAttribute('role','presentation');
  const card=document.createElement('div');card.className='opsynq-confirm-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');
  const heading=document.createElement('h2');heading.textContent=title;const copy=document.createElement('p');copy.textContent=message;card.append(heading,copy);
  let reason=null;if(requireReason){const label=document.createElement('label');label.textContent=reasonLabel;reason=document.createElement('textarea');reason.rows=3;reason.value=defaultReason;reason.placeholder='Add a short reason for the audit trail…';label.append(reason);card.append(label);}
  const actions=document.createElement('div');actions.className='opsynq-confirm-actions';const cancel=document.createElement('button');cancel.type='button';cancel.className='btn secondary';cancel.textContent=cancelLabel;const ok=document.createElement('button');ok.type='button';ok.className=`btn ${tone==='danger'?'danger':'primary'}`;ok.textContent=confirmLabel;actions.append(cancel,ok);card.append(actions);root.append(card);document.body.append(root);
  const finish=result=>{document.removeEventListener('keydown',keydown);root.remove();resolve(result)};const submit=()=>{const value=reason?.value?.trim()||'';if(requireReason&&!value){reason.focus();reason.classList.add('input-error');return}finish({confirmed:true,reason:value})};const keydown=e=>{if(e.key==='Escape')finish({confirmed:false,reason:''});if(e.key==='Enter'&&!e.shiftKey&&document.activeElement!==reason){e.preventDefault();submit()}};document.addEventListener('keydown',keydown);cancel.onclick=()=>finish({confirmed:false,reason:''});ok.onclick=submit;root.onclick=e=>{if(e.target===root)finish({confirmed:false,reason:''})};setTimeout(()=>reason?.focus?.()||ok.focus(),0);
 });
}
