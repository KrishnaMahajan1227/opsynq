import React,{useEffect,useState}from'react';
import{AlertTriangle,CheckCircle2,Database,RefreshCw,ShieldCheck}from'lucide-react';
import{api}from'../../../core/api';
import{PageHeader,Status}from'../../../components/common';

export function ReadinessPage({companyId,onNavigate}){
 const[d,setD]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=async()=>{setLoading(true);setError('');try{const q=companyId?`?companyId=${companyId}`:'';setD(await api(`/api/platform/readiness/company${q}`))}catch(e){setError(e.message)}finally{setLoading(false)}};
 useEffect(()=>{load()},[companyId]);
 const issues=[...(d?.critical||[]).map(x=>({...x,severity:'CRITICAL'})),...(d?.warnings||[]).map(x=>({...x,severity:'WARNING'}))];
 return <><PageHeader eyebrow="UAT & DATA QUALITY" title="Readiness & Data Quality" text="Read-only integrity checks across execution, beneficiaries, inventory, installed assets and logistics before operational release." actions={<button className="btn secondary" onClick={load} disabled={loading}><RefreshCw size={16}/>{loading?'Checking…':'Run checks'}</button>}/>
 {error&&<div className="alert error">{error}</div>}
 {!d&&loading?<section className="panel padded"><p>Running readiness checks…</p></section>:d&&<>
 <section className="readiness-hero panel padded"><div className="readiness-score"><div className={`score-ring ${d.status==='READY'?'ready':d.status==='REVIEW'?'review':'danger'}`}><strong>{d.score}</strong><span>/100</span></div><div><div className="eyebrow">COMPANY READINESS</div><h2>{d.company?.name}</h2><p>{d.status==='READY'?'No integrity exceptions found in the current checks.':d.status==='REVIEW'?'Warnings need operational review before release.':'Critical data integrity issues require attention.'}</p><Status value={d.status}/></div></div><div className="metric-list readiness-metrics"><div><span>Critical issues</span><b>{d.summary?.criticalIssues||0}</b></div><div><span>Warnings</span><b>{d.summary?.warnings||0}</b></div><div><span>Checks passed</span><b>{d.summary?.passedChecks||0}/{d.summary?.checks||0}</b></div><div><span>Beneficiary validity</span><b>{d.summary?.beneficiaryValidity||0}%</b></div><div><span>Database</span><b>{d.database?.connected?'Connected':'Attention'}</b></div></div></section>
 <section className="table-panel"><div className="panel-head padded"><div><h2>Integrity findings</h2><p>Each finding links directly to the module where the underlying records can be reviewed.</p></div></div><div className="table-wrap"><table><thead><tr><th>Severity</th><th>Check</th><th>Records</th><th>What it means</th><th></th></tr></thead><tbody>{issues.map(x=><tr key={x.key}><td><span className={`health-pill ${x.severity==='CRITICAL'?'danger':''}`}>{x.severity}</span></td><td><b>{x.label}</b></td><td>{x.count}</td><td><small>{x.detail}</small></td><td>{x.module&&<button className="btn secondary compact-btn" onClick={()=>onNavigate?.(x.module)}>Open module</button>}</td></tr>)}{!issues.length&&<tr><td colSpan="5"><div className="empty-success"><CheckCircle2 size={22}/><b>No integrity exceptions found</b><span>Current company data passed all Phase 18 readiness checks.</span></div></td></tr>}</tbody></table></div></section>
 <section className="panel padded"><div className="panel-head"><div><h2>Coverage snapshot</h2><p>Read-only counts used to validate that the major operational domains are connected.</p></div></div><div className="readiness-grid">{Object.entries(d.totals||{}).map(([k,v])=><div className="readiness-stat" key={k}><small>{k.replace(/([A-Z])/g,' $1').toUpperCase()}</small><strong>{v}</strong></div>)}</div></section>
 </>}
 </>;
}
