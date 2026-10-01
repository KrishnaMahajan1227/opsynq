import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Badge, Button, Spinner } from 'react-bootstrap';
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUser,
  FaClipboardCheck,
  FaTools,
  FaMoneyBillWave,
  FaImages,
  FaTruck,
  FaBuilding,
  FaExclamationTriangle,
  FaShieldAlt,
  FaBoxOpen,
  FaUpload,
  FaDatabase,
  FaFileAlt,
  FaExpandAlt,
}
 from 'react-icons/fa';
import { API_URL, resolveAssetUrl } from '../config';

const isPresent = (v) => v !== undefined && v !== null && v !== '';
const fmt = (v) => {
  if (!isPresent(v)) return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (v instanceof Date) return v.toLocaleString();
  return String(v);
};
const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? fmt(v) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const Field = ({ label, value, wide = false, mono = false }) => (
  <div className={`farmer-detail-field ${wide ? 'farmer-detail-field--wide' : ''}`}>
    <span>{label}</span>
    <strong className={mono ? 'farmer-detail-mono' : ''}>{fmt(value)}</strong>
  </div>
);

const Section = ({ icon, title, children, full = false }) => (
  <section className={`farmer-detail-section ${full ? 'farmer-detail-section--full' : ''}`}>
    <div className="farmer-detail-section__head"><span>{icon}</span><h3>{title}</h3></div>
    <div className="farmer-detail-grid">{children}</div>
  </section>
);

const Gallery = ({ title, images = [], geo = null }) => {
  const clean = images.filter(Boolean).map(resolveAssetUrl);
  if (!clean.length) return null;
  return (
    <div className="farmer-media-block">
      <div className="farmer-media-block__title">{title}<span>{clean.length}</span></div>
      <div className="farmer-media-grid">
        {clean.map((src, index) => (
          <a key={`${src}-${index}`} href={src} target="_blank" rel="noreferrer" className="farmer-media-card">
            <img src={src} alt={`${title} ${index + 1}`} loading="lazy" />
            <span>Open image</span>{geo?.latitude&&geo?.longitude&&<em className="farmer-media-geo"><FaMapMarkerAlt/> {Number(geo.latitude).toFixed(5)}, {Number(geo.longitude).toFixed(5)}{geo.capturedAt?` · ${fmtDate(geo.capturedAt)}`:''}</em>}
          </a>
        ))}
      </div>
    </div>
  );
};


const getDeviceGeo=()=>new Promise(resolve=>{if(!navigator.geolocation)return resolve(null);navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy,capturedAt:new Date().toISOString()}),()=>resolve(null),{enableHighAccuracy:true,timeout:8000,maximumAge:30000})});

const GeoMeta=({geo})=>{if(!geo?.latitude||!geo?.longitude)return null;return <span className="farmer-geo-chip"><FaMapMarkerAlt/> {Number(geo.latitude).toFixed(5)}, {Number(geo.longitude).toFixed(5)} · {fmtDate(geo.capturedAt)}</span>};

const isImageEvidence = (file, evidenceType) => {
  if (['PHOTO','SIGNATURE'].includes(String(evidenceType || '').toUpperCase())) return true;
  const mime = String(file?.mimeType || '').toLowerCase();
  const url = String(file?.url || '').split('?')[0].toLowerCase();
  return mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|heic|heif)$/.test(url);
};

const EvidenceFilePreview = ({ file, index, evidenceType, geo }) => {
  const src = resolveAssetUrl(file?.url);
  if (!src) return null;
  const image = isImageEvidence(file, evidenceType);
  return (
    <a className={`farmer-evidence-preview ${image ? 'is-image' : 'is-document'}`} href={src} target="_blank" rel="noreferrer">
      {image ? <img src={src} alt={`${String(evidenceType || 'Evidence').toLowerCase()} ${index + 1}`} loading="lazy" /> : <span className="farmer-evidence-preview__icon"><FaFileAlt /></span>}
      <span className="farmer-evidence-preview__body">
        <strong>{file?.name || `${evidenceType || 'Evidence'} ${index + 1}`}</strong>
        <small>{image ? 'Preview image' : 'Open document'} <FaExpandAlt /></small>
        <GeoMeta geo={file?.geo || geo} />
      </span>
    </a>
  );
};

const EvidenceChecklist = ({ items = [], farmerId, onUpdated }) => {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const submitValue = async (entry, value, files = []) => {
    const req = entry.requirement;
    setBusyId(req._id); setError('');
    try {
      const geo=await getDeviceGeo();
      await axios.post(`${API_URL}/api/farmers/${farmerId}/evidence/${req._id}`, { value, files, geo }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      onUpdated?.();
    } catch (err) { setError(err.response?.data?.message || 'Unable to submit evidence.'); }
    finally { setBusyId(''); }
  };
  const upload = async (entry, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusyId(entry.requirement._id); setError('');
    try {
      const fd = new FormData(); files.forEach(file => fd.append('files', file));
      const folder = entry.requirement.stage === 'SURVEY' ? 'Opsynq/Inspection_Photos' : 'Opsynq/Installation_Photos';
      const res = await axios.post(`${API_URL}/api/farmers/upload?folder=${encodeURIComponent(folder)}`, fd, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'multipart/form-data' } });
      const geo=await getDeviceGeo();
      const uploaded = (res.data?.urls || []).map((url, i) => ({ url, name: files[i]?.name || `evidence-${i + 1}`, mimeType: files[i]?.type || 'image/jpeg' }));
      await axios.post(`${API_URL}/api/farmers/${farmerId}/evidence/${entry.requirement._id}`, { files: uploaded, geo }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      onUpdated?.();
    } catch (err) { setError(err.response?.data?.message || 'Evidence upload failed.'); }
    finally { setBusyId(''); }
  };
  if (!items.length) return null;
  const groups = items.reduce((acc, entry) => {
    const stage = entry.requirement?.stage || 'OTHER';
    (acc[stage] ||= []).push(entry);
    return acc;
  }, {});
  return <Section icon={<FaClipboardCheck />} title="Evidence checklist" full>
    <div className="farmer-evidence-checklist farmer-detail-field--wide">
      <div className="farmer-evidence-intro">
        <div><strong>Company evidence control</strong><span>Requirements below come from the mapped Company / Program and stay synced with technician submissions.</span></div>
        <b>{items.filter(x=>['SUBMITTED','VERIFIED','WAIVED'].includes(x.submission?.status)).length}/{items.length} complete</b>
      </div>
      {error && <div className="farmer-evidence-error">{error}</div>}
      {Object.entries(groups).map(([stage, entries]) => {
        const completeCount=entries.filter(x=>['SUBMITTED','VERIFIED','WAIVED'].includes(x.submission?.status)).length;
        return <section className="farmer-evidence-stage" key={stage}>
          <div className="farmer-evidence-stage__head"><div><span>{String(stage).replaceAll('_',' ')}</span><strong>{completeCount}/{entries.length} complete</strong></div></div>
          <div className="farmer-evidence-stage__items">
          {entries.map(entry => { const r = entry.requirement || {}, sub = entry.submission; const complete = ['SUBMITTED','VERIFIED','WAIVED'].includes(sub?.status); const accept=r.evidenceType==='DOCUMENT'?'application/pdf,image/*':'image/*'; return <article className={`farmer-evidence-item ${complete?'is-complete':'is-pending'}`} key={r._id}>
            <div className="farmer-evidence-type">{r.evidenceType}</div>
            <div className="farmer-evidence-copy"><strong>{r.label}</strong><span>{r.required ? 'Required' : 'Optional'}{Number(r.minFiles||0)>1?` · minimum ${r.minFiles} files`:''}</span>{sub?.notes && <small>{sub.notes}</small>}</div>
            <Badge bg={sub?.status === 'VERIFIED' ? 'success' : sub?.status === 'REJECTED' ? 'danger' : complete ? 'success' : 'secondary'}>{sub?.status || 'PENDING'}</Badge>
            {['PHOTO','DOCUMENT','SIGNATURE'].includes(r.evidenceType) && <label className="farmer-evidence-upload"><FaUpload />{busyId===r._id?'Uploading…':sub?'Replace evidence':'Upload evidence'}<input type="file" accept={accept} multiple={Number(r.minFiles||1)>1} disabled={busyId===r._id} onChange={e=>upload(entry,e.target.files)} /></label>}
            {r.evidenceType === 'BOOLEAN' && <Button size="sm" variant="outline-success" disabled={busyId===r._id} onClick={()=>submitValue(entry,true,[])}>{busyId===r._id?'Saving…':'Confirm'}</Button>}
            {sub?.files?.length>0 && <div className="farmer-evidence-files">{sub.files.map((f,i)=><EvidenceFilePreview key={`${f.url}-${i}`} file={f} index={i} evidenceType={r.evidenceType} geo={sub.captureGeo} />)}</div>}
          </article>})}
          </div>
        </section>
      })}
    </div>
  </Section>;
};


export default function FarmerDetailView({ farmer, onBack }) {
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState('');
  const [contextVersion, setContextVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!farmer?._id) return;
      setContextLoading(true);
      setContextError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/farmers/detail-context/${farmer._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (active) setContext(res.data);
      } catch (err) {
        if (active) setContextError(err.response?.data?.message || 'Operational context is unavailable for this record.');
      } finally {
        if (active) setContextLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [farmer?._id, contextVersion]);

  const allEvidence = useMemo(() => {
    if (!farmer) return [];
    return [
      farmer.farmerPhotoUrl,
      ...(farmer.sitePhotosUrls || []),
      farmer.signatureUrl,
      farmer.installedPhotoUpload,
      farmer.finalfarmerPhotoUrl,
      ...(farmer.finalsitePhotosUrls || []),
      farmer.finalsignatureUrl,
      farmer.finalsurveyorsignatureUrl,
      ...(farmer.lrPhotoUrls || []),
    ].filter(Boolean);
  }, [farmer]);

  if (!farmer) return null;
  const status = farmer.applicationStatus || 'Pending';
  const statusTone = status === 'Complaint Raised' ? 'danger' : ['Closed', 'Installation Completed'].includes(status) ? 'success' : 'secondary';
  const ops = context?.context;
  const assets = context?.assets || [];
  const serviceCases = context?.serviceCases || [];
  const compliance = context?.compliance || [];
  const materialIssues = context?.materialIssues || [];
  const materialReconciliation = context?.materialReconciliation || null;
  const evidenceChecklist = context?.evidenceChecklist || [];
  const siteParts=String(farmer.siteLocation||'').split(',').map(x=>Number(String(x).trim()));
  const siteGeo=siteParts.length>=2&&Number.isFinite(siteParts[0])&&Number.isFinite(siteParts[1])?{latitude:siteParts[0],longitude:siteParts[1]}:null;

  return (
    <div className="farmer-detail-page">
      <div className="farmer-detail-topbar">
        <Button variant="outline-secondary" size="sm" onClick={onBack}><FaArrowLeft className="me-2" />Back to records</Button>
        <div className="farmer-detail-statuses">
          <Badge bg={statusTone}>{status}</Badge>
          <Badge bg={farmer.inspectionStatus === 'Completed' ? 'success' : 'secondary'}>Survey: {farmer.inspectionStatus || 'Pending'}</Badge>
          {farmer.complaintStatus && <Badge bg={farmer.complaintStatus === 'Resolved' ? 'success' : 'warning'}>Complaint: {farmer.complaintStatus}</Badge>}
        </div>
      </div>

      <div className="farmer-detail-hero">
        <div className="farmer-detail-avatar farmer-detail-avatar--photo">
          {farmer.farmerPhotoUrl ? <img src={resolveAssetUrl(farmer.farmerPhotoUrl)} alt={farmer.beneficiaryName || 'Beneficiary'} /> : <FaUser />}
        </div>
        <div className="farmer-detail-hero__copy">
          <span className="farmer-detail-eyebrow">Beneficiary record</span>
          <h2>{farmer.beneficiaryName || 'Unnamed beneficiary'}</h2>
          <div className="farmer-detail-meta">
            <span>ID: {fmt(farmer.beneficiaryId)}</span>
            <span><FaPhoneAlt /> {fmt(farmer.mobile)}</span>
            <span><FaMapMarkerAlt /> {[farmer.village, farmer.taluka, farmer.district].filter(Boolean).join(', ') || 'Location unavailable'}</span>
            {ops?.agencyId?.name && <span><FaBuilding /> {ops.agencyId.name}</span>}
          </div>
        </div>
      </div>

      {contextLoading && <div className="farmer-context-banner"><Spinner size="sm" animation="border" /> Loading Opsynq operational context…</div>}
      {contextError && <div className="farmer-context-banner farmer-context-banner--muted">{contextError}</div>}

      <div className="farmer-detail-layout">
        <Section icon={<FaUser />} title="Beneficiary & scheme">
          <Field label="Beneficiary ID" value={farmer.beneficiaryId} />
          <Field label="Beneficiary name" value={farmer.beneficiaryName} />
          <Field label="Mobile" value={farmer.mobile} />
          <Field label="Alternate mobile" value={farmer.alternateMobileNumber} />
          <Field label="Aadhar" value={farmer.aadharNo} />
          <Field label="Caste category" value={farmer.casteCategory} />
          <Field label="Scheme" value={farmer.scheme} wide />
          <Field label="Land ownership" value={farmer.landOwnershipType} />
          <Field label="Land holding" value={farmer.landHoldingAcre ? `${farmer.landHoldingAcre} acre` : ''} />
        </Section>

        <Section icon={<FaMapMarkerAlt />} title="Location & site">
          <Field label="Division" value={farmer.divisionName} />
          <Field label="Circle" value={farmer.circleName} />
          <Field label="Zone" value={farmer.zoneName} />
          <Field label="District" value={farmer.district} />
          <Field label="Taluka" value={farmer.taluka} />
          <Field label="Village" value={farmer.village} />
          <Field label="Land address" value={farmer.landAddress} wide />
          <Field label="Site location" value={farmer.siteLocation} wide />
          <Field label="Source type" value={farmer.sourceType} />
          <Field label="Source depth" value={farmer.sourceDepthFeet ? `${farmer.sourceDepthFeet} ft` : ''} />
          <Field label="Actual head" value={farmer.actualHeadM ? `${farmer.actualHeadM} m` : ''} />
          <Field label="Site depth" value={farmer.siteDepth} />
        </Section>

        <Section icon={<FaClipboardCheck />} title="Survey & verification">
          <Field label="Surveyor" value={farmer.surveyorName} />
          <Field label="Surveyor mobile" value={farmer.surveyorMobile} />
          <Field label="Survey date" value={fmtDate(farmer.surveyDate)} />
          <Field label="JSR technician" value={farmer.jsrTechnician} />
          <Field label="Survey status" value={farmer.inspectionStatus} />
          <Field label="Final inspection" value={farmer.inspectionStatusFinal} wide />
          <Field label="JSR / deviation" value={farmer.jsrDeviationYesNo} />
          <Field label="Deviation remarks" value={farmer.deviationRemarks} wide />
        </Section>

        <Section icon={<FaTruck />} title="Material, dispatch & receipt">
          <Field label="Material location" value={farmer.materialOnSiteOrWarehouse} />
          <Field label="Warehouse inward" value={fmtDate(farmer.warehouseInwardDate)} />
          <Field label="Lot no." value={farmer.lotNo} />
          <Field label="Set" value={farmer.fullSetOrPartialSet} />
          <Field label="Invoice no." value={farmer.invoiceNo} />
          <Field label="Waybill" value={farmer.waybillNoFromCompany || farmer.waybillNo} />
          <Field label="Dispatch date" value={fmtDate(farmer.materialDispatchDate)} />
          <Field label="Transporter" value={farmer.transporterName} />
          <Field label="Vehicle" value={farmer.transporterVehicleNo || farmer.vehicleNo} />
          <Field label="Material received" value={farmer.materialReceivedConfirmationYesNo} />
          <Field label="Material received date" value={fmtDate(farmer.materialReceivedDate)} />
          <Field label="Shortage / damage" value={farmer.shortageDamagedRemarks} wide />
        </Section>

        {materialReconciliation && <Section icon={<FaBoxOpen />} title="Material reconciliation" full>
          <div className="agency-material-recon farmer-detail-field--wide">
            <div><small>Issued</small><strong>{materialReconciliation.totals?.issued || 0}</strong></div>
            <div><small>Technician received</small><strong>{materialReconciliation.totals?.received || 0}</strong></div>
            <div><small>Installed</small><strong>{materialReconciliation.totals?.installed || 0}</strong></div>
            <div><small>Remaining</small><strong>{materialReconciliation.totals?.remaining || 0}</strong></div>
            <div><small>Returned</small><strong>{materialReconciliation.totals?.returned || 0}</strong></div>
            <div><small>Damaged / missing</small><strong>{Number(materialReconciliation.totals?.damaged || 0) + Number(materialReconciliation.totals?.missing || 0)}</strong></div>
            <div><small>Mismatch</small><strong>{materialReconciliation.totals?.mismatch || 0}</strong></div>
          </div>
          {materialReconciliation.receipt && <div className="beneficiary-custody-card farmer-detail-field--wide">
            <div className="beneficiary-custody-head"><div><strong>Technician receipt · {materialReconciliation.receipt.receiptNo}</strong><span>{materialReconciliation.receipt.technician?.username || 'Technician'} · {materialReconciliation.receipt.receivedAt ? new Date(materialReconciliation.receipt.receivedAt).toLocaleString('en-IN') : '—'}</span></div><Badge bg={materialReconciliation.receipt.status === 'CONFIRMED' ? 'success' : 'warning'}>{materialReconciliation.receipt.status}</Badge></div>
            <div className="beneficiary-custody-items">{(materialReconciliation.receipt.items || []).map((x,idx)=><div key={`${x.serialNumber}-${idx}`} className={x.condition === 'GOOD' ? 'is-good' : 'has-exception'}><small>{x.role || 'OTHER'} · {x.item?.name || x.item?.sku || 'Material'}</small><code>{x.serialNumber}</code><strong>{x.condition}</strong></div>)}</div>
            {materialReconciliation.receipt.remarks && <p>{materialReconciliation.receipt.remarks}</p>}
          </div>}
          {(materialReconciliation.items || []).map((item) => <div key={item.itemId} className="farmer-context-row farmer-detail-field--wide"><div><strong>{item.sku || 'Item'} · {item.name}</strong><span>{item.role || 'OTHER'} · Issued {item.issued} · Received {item.received || 0} · Installed {item.installed} · Remaining {item.remaining}</span></div><Badge bg={Number(item.mismatch || 0) > 0 || Number(item.damaged || 0) > 0 || Number(item.missing || 0) > 0 ? 'warning' : 'success'}>{Number(item.mismatch || 0) > 0 ? `${item.mismatch} mismatch` : 'Reconciled'}</Badge></div>)}
        </Section>}

        <Section icon={<FaTools />} title="Pump, installation & commissioning">
          <Field label="Assigned vendor / company" value={farmer.assignedVendorCompanyName} wide />
          <Field label="Pump type" value={farmer.pumpType} />
          <Field label="Pump HP" value={farmer.pumpHP} />
          <Field label="Controller" value={farmer.controllerTypeWithOrWithout} />
          <Field label="Pump no." value={farmer.pumpNoUnique} mono />
          <Field label="Motor no." value={farmer.motorNoUnique} mono />
          <Field label="Controller no." value={farmer.controllerNoUnique} mono />
          <Field label="IMEI" value={farmer.imeiNoUnique} mono />
          <Field label="Installation done" value={farmer.installationDoneYesNo} />
          <Field label="Installation assigned to" value={farmer.installationAssignedTechnician} />
          <Field label="Installation assignment date" value={fmtDate(farmer.installationAssignedAt)} />
          <Field label="Installed by" value={farmer.installedByTechnicianName} />
          <Field label="Installation date" value={fmtDate(farmer.installationDate)} />
          <Field label="Completion date" value={fmtDate(farmer.installationCompletionDate)} />
          <Field label="Commissioning date" value={fmtDate(farmer.commissioningDate)} />
          <Field label="Panels / serials" value={farmer.panels} wide />
        </Section>

        <Section icon={<FaMoneyBillWave />} title="Commercial & rework">
          <Field label="Vendor rate" value={farmer.rateVendor} />
          <Field label="Payment received" value={farmer.paymentReceivedAmount} />
          <Field label="Payment received date" value={fmtDate(farmer.paymentReceivedDate)} />
          <Field label="Subcontractor rate" value={farmer.subcontractorRate} />
          <Field label="Payment given" value={farmer.paymentGivenToSubcontractor} />
          <Field label="Payment pending" value={farmer.paymentPending} />
          <Field label="Charges to debit" value={farmer.chargesToDebit} />
          <Field label="Rework" value={farmer.reWork} />
          <Field label="Issues" value={farmer.issues} wide />
          <Field label="Rework technician" value={farmer.reworkAssignTechnician} />
          <Field label="Solution date" value={fmtDate(farmer.solutionDate)} />
        </Section>

        <Section icon={<FaExclamationTriangle />} title="Complaint & service">
          <Field label="Complaint no." value={farmer.complaintNumber} />
          <Field label="Complaint status" value={farmer.complaintStatus} />
          <Field label="Raised date" value={fmtDate(farmer.complaintRaisedDate)} />
          <Field label="Raised by" value={farmer.complaintRaisedByName} />
          <Field label="Issue" value={farmer.complaintIssue} wide />
          <Field label="Pump not operating" value={farmer.pumpNotOperatingYesNo} />
          <Field label="Remarks" value={farmer.remarks} wide />
          {serviceCases.map((item) => (
            <div key={item._id} className="farmer-context-row farmer-detail-field--wide">
              <div><strong>{item.caseNo} · {item.title}</strong><span>{item.type} · {item.priority}</span></div>
              <Badge bg={['RESOLVED', 'CLOSED'].includes(item.status) ? 'success' : item.slaState === 'BREACHED' ? 'danger' : 'warning'}>{item.status}</Badge>
            </div>
          ))}
        </Section>

        {farmer.customFields && Object.keys(farmer.customFields).length > 0 && (
          <Section icon={<FaDatabase />} title="Custom imported fields" full>
            {Object.entries(farmer.customFields).sort(([a],[b]) => a.localeCompare(b)).map(([key, value]) => <Field key={key} label={key} value={value} />)}
          </Section>
        )}

        {ops && (
          <Section icon={<FaBuilding />} title="Opsynq assignment context">
            <Field label="Company" value={ops.companyId?.name} />
            <Field label="Company code" value={ops.companyId?.code} />
            <Field label="Agency" value={ops.agencyId?.name} />
            <Field label="Agency code" value={ops.agencyId?.code} />
            <Field label="Program" value={ops.programId?.name} wide />
            <Field label="Program authority" value={ops.programId?.authority} wide />
            <Field label="Work order" value={ops.workOrderId ? `${ops.workOrderId.number} · ${ops.workOrderId.title || ''}` : ''} wide />
            <Field label="Work package" value={ops.workPackageId ? `${ops.workPackageId.code} · ${ops.workPackageId.name || ''}` : ''} wide />
            <Field label="Package status" value={ops.workPackageId?.status} />
            <Field label="Package due" value={fmtDate(ops.workPackageId?.dueDate)} />
            <Field label="Assigned by" value={ops.assignmentAttribution?.name} />
            <Field label="Assigned by role" value={ops.assignmentAttribution?.role ? String(ops.assignmentAttribution.role).replaceAll('_', ' ') : ''} />
            <Field label="Assigned on" value={fmtDate(ops.assignmentAttribution?.assignedAt || ops.assignedAt)} />
            <Field label="Assignment source" value={ops.assignmentAttribution?.source === 'IMPORT' ? 'Company beneficiary import' : ops.assignmentAttribution?.source === 'ASSIGNMENT' ? 'Company assignment' : 'Legacy assignment'} />
            <Field label="Source authority" value={ops.sourceAuthority} wide />
            <Field label="Validation" value={ops.validationStatus} />
          </Section>
        )}

        {!!assets.length && (
          <Section icon={<FaBoxOpen />} title="Installed asset register">
            {assets.map((asset) => (
              <div key={asset._id} className="farmer-asset-row farmer-detail-field--wide">
                <div>
                  <span>{asset.assetRole}</span>
                  <strong>{asset.itemId?.name || asset.serialNumber}</strong>
                  <small>{asset.itemId?.sku || 'Item'} · Technician: {asset.technicianUserId?.username || '—'}</small>
                </div>
                <div>
                  <strong>{asset.serialNumber}</strong>
                  <small>{asset.status} · Installed {fmtDate(asset.installedAt)}</small>
                </div>
              </div>
            ))}
          </Section>
        )}

        {!!materialIssues.length && (
          <Section icon={<FaTruck />} title="Technician material issues">
            {materialIssues.map((issue) => (
              <div key={issue._id} className="farmer-context-row farmer-detail-field--wide">
                <div><strong>{issue.issueNo}</strong><span>{issue.technicianUserId?.username || 'Technician'} · {fmtDate(issue.issuedAt)}</span></div>
                <Badge bg={issue.status === 'CONSUMED' ? 'success' : 'secondary'}>{issue.status}</Badge>
              </div>
            ))}
          </Section>
        )}

        {!!compliance.length && (
          <Section icon={<FaShieldAlt />} title="Quality & compliance">
            {compliance.map((record) => (
              <div key={record._id} className="farmer-context-row farmer-detail-field--wide">
                <div><strong>{record.recordNo} · {record.type}</strong><span>{record.notes || `${record.items?.length || 0} checks`}</span></div>
                <Badge bg={record.status === 'PASS' ? 'success' : record.status === 'FAIL' ? 'danger' : 'secondary'}>{record.status}</Badge>
              </div>
            ))}
          </Section>
        )}

        <EvidenceChecklist items={evidenceChecklist} farmerId={farmer._id} onUpdated={()=>setContextVersion(v=>v+1)} />

        <Section icon={<FaImages />} title="Photos & field evidence" full>
          <div className="farmer-media-wrap farmer-detail-field--wide">
            <Gallery title="Survey / beneficiary evidence" images={[farmer.farmerPhotoUrl, ...(farmer.sitePhotosUrls || []), farmer.signatureUrl]} geo={siteGeo?{...siteGeo,capturedAt:farmer.surveyDate}:null} />
            <Gallery title="Installation / final verification" images={[farmer.installedPhotoUpload, farmer.finalfarmerPhotoUrl, ...(farmer.finalsitePhotosUrls || []), farmer.finalsignatureUrl, farmer.finalsurveyorsignatureUrl]} geo={siteGeo?{...siteGeo,capturedAt:farmer.installationCompletionDate||farmer.installationDate}:null} />
            <Gallery title="Logistics / LR evidence" images={farmer.lrPhotoUrls || []} geo={siteGeo?{...siteGeo,capturedAt:farmer.materialReceivedDate||farmer.materialDispatchDate}:null} />
            {!allEvidence.length && <div className="farmer-empty-evidence">No photo evidence has been uploaded for this beneficiary.</div>}
          </div>
        </Section>
      </div>
    </div>
  );
}
