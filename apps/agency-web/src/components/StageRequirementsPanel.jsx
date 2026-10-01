import React,{useEffect,useMemo,useState} from 'react';
import axios from 'axios';
import {Badge,Button,Form,Spinner} from 'react-bootstrap';
import {FaCamera,FaCheck,FaClock,FaFileAlt,FaImage,FaSignature,FaUpload} from 'react-icons/fa';
import {API_URL,resolveAssetUrl} from '../config';
import './StageRequirementsPanel.css';

const stageLabel=v=>String(v||'').replaceAll('_',' ');
const isDone=s=>['SUBMITTED','VERIFIED','WAIVED'].includes(String(s||''));
const iconFor=t=>t==='SIGNATURE'?<FaSignature/>:t==='DOCUMENT'?<FaFileAlt/>:t==='PHOTO'?<FaImage/>:<FaCheck/>;
const fmtSla=(key,value)=>{
  const label=String(key||'').replace(/([A-Z])/g,' $1').replace(/[_-]+/g,' ').trim();
  if(value&&typeof value==='object')return null;
  return {label:label.charAt(0).toUpperCase()+label.slice(1),value:String(value)};
};
const collectSla=(cfg,stages)=>{
  if(!cfg||typeof cfg!=='object')return[];
  const wanted=stages.map(x=>String(x).toLowerCase().replace('_',''));
  const out=[];
  for(const [k,v] of Object.entries(cfg)){
    const nk=String(k).toLowerCase().replace(/[_-]/g,'');
    if(v&&typeof v==='object'){
      if(wanted.some(s=>nk.includes(s))||['survey','installation','finalinspection'].includes(nk)){
        Object.entries(v).forEach(([a,b])=>{const row=fmtSla(`${k} ${a}`,b);if(row)out.push(row)});
      }
    }else if(wanted.some(s=>nk.includes(s))){const row=fmtSla(k,v);if(row)out.push(row)}
  }
  return out;
};

export default function StageRequirementsPanel({farmerId,stages=[],title='Company requirements',onStateChange}){
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[error,setError]=useState(''),[textValues,setTextValues]=useState({});
  const token=localStorage.getItem('token');
  const auth={headers:token?{Authorization:`Bearer ${token}`}:{}};
  const stageKey=stages.join('|');
  const load=async()=>{
    if(!farmerId)return;
    setLoading(true);setError('');
    try{const res=await axios.get(`${API_URL}/api/farmers/detail-context/${farmerId}`,auth);setData(res.data)}
    catch(e){setError(e.response?.data?.message||'Unable to load Company execution requirements.')}
    finally{setLoading(false)}
  };
  useEffect(()=>{load()},[farmerId,stageKey]);
  const items=useMemo(()=>(data?.evidenceChecklist||[]).filter(x=>stages.includes(x.requirement?.stage)),[data,stageKey]);
  const pendingRequired=items.filter(x=>x.requirement?.required&&!isDone(x.submission?.status));
  const slaItems=useMemo(()=>{
    const governed=(data?.slaRules||[]).filter(rule=>stages.includes(rule.appliesTo)).map(rule=>({
      label:rule.name||stageLabel(rule.appliesTo),
      value:`${rule.targetHours}h target${Number(rule.warningHours||0)>0?` · warning ${rule.warningHours}h before`:''}`,
      stage:rule.appliesTo,
    }));
    return governed.length?governed:collectSla(data?.context?.programId?.slaConfig||{},stages);
  },[data,stageKey]);
  useEffect(()=>{onStateChange?.({loading,items,pendingRequired,slaItems,context:data?.context||null,refresh:load})},[loading,items.length,pendingRequired.length,slaItems.length,data?.context?._id]);

  const submitValue=async(entry,value)=>{
    const req=entry.requirement;setBusy(req._id);setError('');
    try{await axios.post(`${API_URL}/api/farmers/${farmerId}/evidence/${req._id}`,{value,files:[]},auth);await load()}
    catch(e){setError(e.response?.data?.message||'Unable to save evidence response.')}
    finally{setBusy('')}
  };
  const upload=async(entry,list)=>{
    const files=Array.from(list||[]);if(!files.length)return;
    const req=entry.requirement;setBusy(req._id);setError('');
    try{
      const fd=new FormData();files.forEach(f=>fd.append('files',f));
      const folder=req.stage==='SURVEY'?'Opsynq/Inspection_Photos':'Opsynq/Installation_Photos';
      const up=await axios.post(`${API_URL}/api/farmers/upload?folder=${encodeURIComponent(folder)}`,fd,{headers:{...auth.headers,'Content-Type':'multipart/form-data'}});
      const payload=(up.data?.urls||[]).map((url,i)=>({url,name:files[i]?.name||`evidence-${i+1}`,mimeType:files[i]?.type||'application/octet-stream'}));
      await axios.post(`${API_URL}/api/farmers/${farmerId}/evidence/${req._id}`,{files:payload},auth);await load();
    }catch(e){setError(e.response?.data?.message||'Evidence upload failed.')}
    finally{setBusy('')}
  };
  if(!loading&&!items.length&&!slaItems.length)return null;
  return <section className="stage-requirements">
    <div className="stage-requirements__head"><div><span>COMPANY CONTROL</span><h6>{title}</h6><p>These requirements come from the mapped Company / Program and stay synced with Company evidence control.</p></div>{loading?<Spinner size="sm"/>:<Badge bg={pendingRequired.length?'warning':'success'}>{pendingRequired.length?`${pendingRequired.length} pending`:'Ready'}</Badge>}</div>
    {slaItems.length>0&&<div className="stage-sla-strip"><div><FaClock/><strong>Execution SLA</strong></div>{slaItems.map((x,i)=><span key={`${x.label}-${i}`}><b>{x.label}</b>{x.value}</span>)}</div>}
    {error&&<div className="stage-requirements__error">{error}<Button size="sm" variant="outline-secondary" onClick={load}>Retry</Button></div>}
    <div className="stage-requirements__grid">
      {items.map(entry=>{const r=entry.requirement||{},sub=entry.submission,done=isDone(sub?.status),fileType=r.evidenceType==='DOCUMENT'?'application/pdf,image/*':'image/*';return <article key={r._id} className={`stage-rule ${done?'is-complete':'is-pending'}`}>
        <div className="stage-rule__icon">{iconFor(r.evidenceType)}</div>
        <div className="stage-rule__copy"><div><strong>{r.label}</strong>{r.required&&<em>Required</em>}</div><span>{stageLabel(r.stage)} · {r.evidenceType}{Number(r.minFiles||0)>1?` · Min ${r.minFiles} files`:''}</span>{sub?.notes&&<small>{sub.notes}</small>}</div>
        <Badge bg={sub?.status==='VERIFIED'?'success':sub?.status==='REJECTED'?'danger':done?'success':'secondary'}>{sub?.status||'PENDING'}</Badge>
        {['PHOTO','DOCUMENT','SIGNATURE'].includes(r.evidenceType)&&<label className="stage-rule__upload"><FaUpload/>{busy===r._id?'Uploading…':sub?'Replace':'Upload'}<input type="file" accept={fileType} multiple={Number(r.minFiles||1)>1} disabled={busy===r._id} onChange={e=>upload(entry,e.target.files)}/></label>}
        {r.evidenceType==='BOOLEAN'&&<Button size="sm" variant="outline-success" disabled={busy===r._id} onClick={()=>submitValue(entry,true)}><FaCheck/> Confirm</Button>}
        {r.evidenceType==='TEXT'&&<div className="stage-rule__text"><Form.Control value={textValues[r._id]??sub?.value??''} onChange={e=>setTextValues(v=>({...v,[r._id]:e.target.value}))} placeholder="Enter required detail"/><Button size="sm" disabled={busy===r._id||!String(textValues[r._id]??sub?.value??'').trim()} onClick={()=>submitValue(entry,textValues[r._id]??sub?.value)}>Save</Button></div>}
        {sub?.files?.length>0&&<div className="stage-rule__files">{sub.files.map((f,i)=>{const src=resolveAssetUrl(f.url),image=String(f.mimeType||'').startsWith('image/')||r.evidenceType!=='DOCUMENT';return <a key={`${f.url}-${i}`} href={src} target="_blank" rel="noreferrer">{image?<img src={src} alt={`${r.label} ${i+1}`} loading="lazy"/>:<FaFileAlt/>}<span>{f.name||`Evidence ${i+1}`}</span></a>})}</div>}
      </article>})}
    </div>
  </section>;
}
