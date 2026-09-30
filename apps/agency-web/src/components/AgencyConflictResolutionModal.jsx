import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const label=v=>String(v||'').replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const value=v=>v===undefined||v===null||v===''?'—':typeof v==='object'?JSON.stringify(v):String(v);
export default function AgencyConflictResolutionModal({conflict,onClose,onSkip,onUpdate,busy=false}){
 if(!conflict)return null;
 const diffs=conflict.differences||[];
 return <Modal show centered size="lg" onHide={()=>!busy&&onClose?.()} backdrop={busy?'static':true}><div className="agency-duplicate-modal"><Modal.Header closeButton={!busy}><div><small className="agency-duplicate-kicker">DUPLICATE REVIEW</small><Modal.Title>{conflict.entityType||'Record'} already exists</Modal.Title><p>Compare the saved record with the incoming values. Nothing is overwritten until you choose an action.</p></div></Modal.Header><Modal.Body><div className="agency-duplicate-identity"><span>Matched by</span><strong>{conflict.key||conflict.existingId||'Existing record'}</strong></div>{diffs.length?<div className="agency-duplicate-diff-grid">{diffs.map((d,i)=><article key={`${d.field}-${i}`}><b>{label(d.field)}</b><div><span>Existing</span><strong>{value(d.existing)}</strong></div><div><span>Incoming</span><strong>{value(d.incoming)}</strong></div></article>)}</div>:<div className="agency-duplicate-nochange">Incoming values match the existing record. Skip is safe.</div>}</Modal.Body><Modal.Footer><Button variant="outline-secondary" disabled={busy} onClick={()=>onClose?.()}>Go back</Button><Button variant="outline-secondary" disabled={busy} onClick={()=>onSkip?.()}>Skip new entry</Button>{(conflict.allowedActions||[]).includes('UPDATE')&&<Button variant="primary" disabled={busy} onClick={()=>onUpdate?.()}>{busy?'Updating…':'Update existing user'}</Button>}</Modal.Footer></div></Modal>
}
