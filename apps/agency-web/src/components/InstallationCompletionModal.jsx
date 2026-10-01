import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Accordion, Image } from 'react-bootstrap';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import { 
  Settings, 
  Expand, 
  Minimize, 
  AlertCircle, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Camera, 
  FileImage, 
  PenTool, 
  RotateCcw, 
  Check, 
  X,
  Save,
  User,
  Wrench,
  PackageCheck,
  ScanLine
} from 'lucide-react';
import './InstallationCompletionModal.css';

import { API_URL, resolveAssetUrl } from '../config.js';
import { saveFieldDraft, getFieldDraft, deleteFieldDraft } from '../offlineStore';
import { optimiseImageFile, optimiseImageFiles, totalFileBytes, formatBytes } from '../utils/imageFiles';


export default function InstallationCompletionModal({
  show,
  handleClose,
  farmer,
  onInstallationComplete,
}) {
  // Accordion state
  const [openKeys, setOpenKeys] = useState(['0', '1']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [optimisingPhotos, setOptimisingPhotos] = useState(false);
  const draftKey = farmer?._id ? `installation:${farmer._id}` : '';
  
  const expandAll = () => setOpenKeys(['0', '1']);
  const collapseAll = () => setOpenKeys([]);

  // Installation fields
  const [pumpNoUnique, setPumpNoUnique] = useState('');
  const [motorNoUnique, setMotorNoUnique] = useState('');
  const [controllerNoUnique, setControllerNoUnique] = useState('');
  const [imeiNoUnique, setImeiNoUnique] = useState('');
  const [panelsArray, setPanelsArray] = useState(['']);
  const [installationDoneYesNo, setInstallationDoneYesNo] = useState('');
  const [pumpNotOperatingYesNo, setPumpNotOperatingYesNo] = useState('');
  const [companyAssignedPersonName, setCompanyAssignedPersonName] = useState('');

  // Complaint fields
  const [showComplaintSection, setShowComplaintSection] = useState(false);
  const [complaintIssue, setComplaintIssue] = useState('');
  const [complaintRaisedDate, setComplaintRaisedDate] = useState('');
  const [complaintNumber, setComplaintNumber] = useState('');

  // Signature fields
  const farmerSigRef = useRef();
  const surveyorSigRef = useRef();
  const [finalSignature, setFinalSignature] = useState(null);
  const [finalSurveyorSignature, setFinalSurveyorSignature] = useState(null);
  const [farmerSigPreview, setFarmerSigPreview] = useState(null);
  const [surveyorSigPreview, setSurveyorSigPreview] = useState(null);

  // Final uploads
  const [finalFarmerPhoto, setFinalFarmerPhoto] = useState(null);
  const [finalSitePhotos, setFinalSitePhotos] = useState([]);

  // Opsynq Phase 5 inventory context for mapped company/work-package farmers
  const [issuedInventory, setIssuedInventory] = useState({ linked: false, items: [] });
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanDetails, setScanDetails] = useState({});
  const [scanCameraOpen, setScanCameraOpen] = useState(false);
  const [scanCameraError, setScanCameraError] = useState('');
  const scanVideoRef = useRef(null);
  const [additionalItems, setAdditionalItems] = useState([]);

  const inventoryRole = item => {
    const text = `${item?.itemId?.category || ''} ${item?.itemId?.name || ''} ${item?.itemId?.sku || ''}`.toLowerCase();
    if (text.includes('pump')) return 'PUMP';
    if (text.includes('motor')) return 'MOTOR';
    if (text.includes('controller') || text.includes('inverter')) return 'CONTROLLER';
    if (text.includes('panel') || text.includes('module')) return 'PANEL';
    return 'OTHER';
  };

  const selectedCodes = () => [pumpNoUnique, motorNoUnique, controllerNoUnique, ...panelsArray, ...additionalItems.map(x => x.code)].map(x => String(x || '').trim().toLowerCase()).filter(Boolean);

  const addIssuedItem = item => {
    const code = String(item.serialNumber || item.barcodeValue || '').trim();
    if (!code) return;
    const role = item.role || inventoryRole(item);
    const attrs = item.scanAttributes || item.metadata?.scanAttributes || item.agencyReceiptAttributes || {};
    setScanDetails({ code, role, item: item.itemId?.name || item.itemId?.sku || 'Serialized material', ...attrs });
    const existing = selectedCodes();
    if (existing.includes(code.toLowerCase())) { setScanMessage(`${code} is already selected for this beneficiary.`); return; }
    if (role === 'PUMP') setPumpNoUnique(code);
    else if (role === 'MOTOR') setMotorNoUnique(code);
    else if (role === 'CONTROLLER') {
      setControllerNoUnique(code);
      if (!imeiNoUnique) setImeiNoUnique(String(attrs.imei || attrs.IMEI || attrs.imeiNo || attrs.imeiNumber || ''));
    } else if (role === 'PANEL') {
      setPanelsArray(prev => {
        const firstEmpty = prev.findIndex(v => !String(v || '').trim());
        if (firstEmpty >= 0) { const copy = [...prev]; copy[firstEmpty] = code; return copy; }
        return [...prev, code];
      });
    } else {
      setAdditionalItems(prev => [...prev, { code, name: item.itemId?.name || item.itemId?.sku || 'Additional serialized item', role: 'OTHER' }]);
    }
    setScanMessage(`${code} added to this beneficiary's installation.`);
  };

  const useIssuedSerial = item => addIssuedItem({ ...item, role: inventoryRole(item) });

  const submitScanValue = async raw => {
    const code = String(raw ?? scanCode).trim();
    if (!code || !farmer?._id || scanLoading) return;
    setError(''); setScanMessage(''); setScanLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/installation/scan-issued-material/${farmer._id}`, { code }, { headers: { Authorization: `Bearer ${token}` } });
      addIssuedItem(res.data?.item || {});
      setScanCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Scanned material could not be validated.');
    } finally { setScanLoading(false); }
  };

  useEffect(() => {
    if (!scanCameraOpen) return;
    let stream; let stopped = false; let frame;
    const start = async () => {
      try {
        setScanCameraError('');
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not available on this device/browser.');
        if (!('BarcodeDetector' in window)) throw new Error('Camera barcode decoding is not supported here. Use the phone keyboard or a Bluetooth/USB scanner.');
        const detector = new window.BarcodeDetector({ formats: ['qr_code','code_128','code_39','ean_13','ean_8','upc_a','upc_e','data_matrix'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (scanVideoRef.current) { scanVideoRef.current.srcObject = stream; await scanVideoRef.current.play(); }
        const tick = async () => {
          if (stopped) return;
          try {
            const found = await detector.detect(scanVideoRef.current);
            const raw = found?.[0]?.rawValue;
            if (raw) { stopped = true; setScanCameraOpen(false); setScanCode(raw); await submitScanValue(raw); return; }
          } catch {}
          frame = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) { setScanCameraError(e.message); setScanCameraOpen(false); }
    };
    start();
    return () => { stopped = true; if (frame) cancelAnimationFrame(frame); stream?.getTracks().forEach(t => t.stop()); };
  }, [scanCameraOpen]);

  const scanIssuedMaterial = async e => { e?.preventDefault?.(); await submitScanValue(); };

  // Prefill existing beneficiary/install context when the work item opens.
  useEffect(() => {
    if (!show || !farmer?._id) return;
    setPumpNoUnique(String(farmer.pumpNoUnique || ''));
    setMotorNoUnique(String(farmer.motorNoUnique || ''));
    setControllerNoUnique(String(farmer.controllerNoUnique || ''));
    setImeiNoUnique(String(farmer.imeiNoUnique || ''));
    setPanelsArray(Array.isArray(farmer.panels) && farmer.panels.length ? farmer.panels.map((x) => String(x || '')) : ['']);
    setInstallationDoneYesNo(String(farmer.installationDoneYesNo || ''));
    setPumpNotOperatingYesNo(String(farmer.pumpNotOperatingYesNo || ''));
    setCompanyAssignedPersonName(String(farmer.companyAssignedPersonName || farmer.installationAssignedTechnician || ''));
    setComplaintIssue(String(farmer.complaintIssue || ''));
    setComplaintNumber(String(farmer.complaintNumber || ''));
    setShowComplaintSection(farmer.applicationStatus === 'Complaint Raised' || Boolean(farmer.complaintIssue));
  }, [show, farmer?._id]);

  // Prefill complaint date with the technician's current local date.
  useEffect(() => {
    if (showComplaintSection) {
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      setComplaintRaisedDate(local);
    }
  }, [showComplaintSection]);

  useEffect(() => {
    if (!show || !farmer?._id) return;
    let active = true;
    const load = async () => {
      setInventoryLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/installation/issued-material/${farmer._id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (active) setIssuedInventory(res.data || { linked: false, items: [] });
      } catch (e) {
        if (active) setIssuedInventory({ linked: false, items: [] });
      } finally { if (active) setInventoryLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [show, farmer?._id]);

  // Helpers for panels
  const handlePanelChange = (index, value) => {
    const newPanels = [...panelsArray];
    newPanels[index] = value;
    setPanelsArray(newPanels);
  };

  const addPanelField = () => {
    setPanelsArray([...panelsArray, '']);
  };

  const removePanelField = index => {
    if (panelsArray.length === 1) {
      setError('At least one panel serial number is required.');
      return;
    }
    const newPanels = panelsArray.filter((_, i) => i !== index);
    setPanelsArray(newPanels);
  };

  // Other helpers
  const toggleKey = key => {
    setOpenKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  const onFarmerPhotoChange = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setOptimisingPhotos(true);
    try { setFinalFarmerPhoto(await optimiseImageFile(file, { maxBytes: 280 * 1024, maxDimension: 1440 })); } finally { setOptimisingPhotos(false); }
  };
  const onSitePhotosChange = async e => {
    const files = Array.from(e.target.files || []).slice(0, 12);
    if (!files.length) return;
    setOptimisingPhotos(true);
    try { setFinalSitePhotos(await optimiseImageFiles(files, { maxBytes: 240 * 1024, maxDimension: 1440 })); } finally { setOptimisingPhotos(false); }
  };

  const captureFarmerSig = () => {
    if (farmerSigRef.current.isEmpty()) {
      setError('Please provide a farmer signature.');
      return;
    }
    farmerSigRef.current.getCanvas().toBlob(blob => {
      const file = new File([blob], 'farmer-sign.png', { type: 'image/png' });
      setFinalSignature(file);
      setFarmerSigPreview(URL.createObjectURL(file));
      farmerSigRef.current.clear();
    });
  };

  const captureSurveyorSig = () => {
    if (surveyorSigRef.current.isEmpty()) {
      setError('Please provide a surveyor signature.');
      return;
    }
    surveyorSigRef.current.getCanvas().toBlob(blob => {
      const file = new File([blob], 'surveyor-sign.png', { type: 'image/png' });
      setFinalSurveyorSignature(file);
      setSurveyorSigPreview(URL.createObjectURL(file));
      surveyorSigRef.current.clear();
    });
  };

  useEffect(() => {
    if (!show || !draftKey) return;
    let active = true;
    getFieldDraft(draftKey).then(rec => {
      const d = rec?.data; if (!active || !d) return;
      setPumpNoUnique(d.pumpNoUnique || ''); setMotorNoUnique(d.motorNoUnique || ''); setControllerNoUnique(d.controllerNoUnique || ''); setImeiNoUnique(d.imeiNoUnique || '');
      setPanelsArray(Array.isArray(d.panelsArray) && d.panelsArray.length ? d.panelsArray : ['']); setInstallationDoneYesNo(d.installationDoneYesNo || ''); setPumpNotOperatingYesNo(d.pumpNotOperatingYesNo || ''); setCompanyAssignedPersonName(d.companyAssignedPersonName || '');
      setShowComplaintSection(!!d.showComplaintSection); setComplaintIssue(d.complaintIssue || ''); setComplaintRaisedDate(d.complaintRaisedDate || ''); setComplaintNumber(d.complaintNumber || '');
      setFinalFarmerPhoto(d.finalFarmerPhoto || null); setFinalSitePhotos(Array.isArray(d.finalSitePhotos) ? d.finalSitePhotos : []); setFinalSignature(d.finalSignature || null); setFinalSurveyorSignature(d.finalSurveyorSignature || null); setAdditionalItems(Array.isArray(d.additionalItems) ? d.additionalItems : []); setDraftSavedAt(rec.updatedAt || Date.now());
    });
    return () => { active = false; };
  }, [show, draftKey]);

  useEffect(() => {
    if (!show || !draftKey) return;
    const timer = setTimeout(async () => {
      await saveFieldDraft(draftKey, { pumpNoUnique,motorNoUnique,controllerNoUnique,imeiNoUnique,panelsArray,installationDoneYesNo,pumpNotOperatingYesNo,companyAssignedPersonName,showComplaintSection,complaintIssue,complaintRaisedDate,complaintNumber,finalFarmerPhoto,finalSitePhotos,finalSignature,finalSurveyorSignature,additionalItems,beneficiaryId:farmer?.beneficiaryId,beneficiaryName:farmer?.beneficiaryName });
      setDraftSavedAt(Date.now());
    }, 450);
    return () => clearTimeout(timer);
  }, [show,draftKey,pumpNoUnique,motorNoUnique,controllerNoUnique,imeiNoUnique,panelsArray,installationDoneYesNo,pumpNotOperatingYesNo,companyAssignedPersonName,showComplaintSection,complaintIssue,complaintRaisedDate,complaintNumber,finalFarmerPhoto,finalSitePhotos,finalSignature,finalSurveyorSignature,additionalItems,farmer?.beneficiaryId,farmer?.beneficiaryName]);

  // Reset form state
  const resetForm = () => {
    setPumpNoUnique('');
    setMotorNoUnique('');
    setControllerNoUnique('');
    setImeiNoUnique('');
    setPanelsArray(['']);
    setInstallationDoneYesNo('');
    setPumpNotOperatingYesNo('');
    setCompanyAssignedPersonName('');
    setShowComplaintSection(false);
    setComplaintIssue('');
    setComplaintRaisedDate('');
    setComplaintNumber('');
    setFinalFarmerPhoto(null);
    setFinalSitePhotos([]);
    setFinalSignature(null);
    setFinalSurveyorSignature(null);
    setFarmerSigPreview(null);
    setSurveyorSigPreview(null);
    farmerSigRef.current?.clear();
    surveyorSigRef.current?.clear();
    setError('');
    setIsSubmitting(false);
    setIssuedInventory({ linked: false, items: [] });
    setScanCode('');
    setScanMessage('');
    setScanDetails({});
    setAdditionalItems([]);
  };

  // Form submit
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!farmer?._id) {
      setError('Invalid farmer data.');
      console.log('Error: Invalid farmer data', farmer);
      setIsSubmitting(false);
      return;
    }

    // Validate required fields
    if (!pumpNoUnique || !motorNoUnique || !controllerNoUnique || !imeiNoUnique) {
      setError('Please fill all unique ID fields (Pump, Motor, Controller, IMEI).');
      console.log('Validation failed: Unique IDs missing');
      setIsSubmitting(false);
      return;
    }
    if (!installationDoneYesNo || !pumpNotOperatingYesNo || !companyAssignedPersonName) {
      setError('Please fill all required installation fields.');
      console.log('Validation failed: Installation fields missing');
      setIsSubmitting(false);
      return;
    }
    if (pumpNotOperatingYesNo === 'No' && !showComplaintSection) {
      setError('Please raise a complaint if the pump is not operating.');
      console.log('Validation failed: Complaint section not opened');
      setIsSubmitting(false);
      return;
    }
    if (showComplaintSection && (!complaintIssue || !complaintRaisedDate || !complaintNumber)) {
      setError('Please fill all complaint fields.');
      console.log('Validation failed: Complaint fields missing', {
        complaintIssue,
        complaintRaisedDate,
        complaintNumber,
      });
      setIsSubmitting(false);
      return;
    }
    const nonEmptyPanels = panelsArray.filter(panel => panel.trim() !== '');
    if (nonEmptyPanels.length < 1) {
      setError('Please provide at least one panel serial number.');
      console.log('Validation failed: At least one panel required');
      setIsSubmitting(false);
      return;
    }
    if (!finalSignature) {
      setError('Farmer signature is required.');
      console.log('Validation failed: Farmer signature missing');
      setIsSubmitting(false);
      return;
    }
    if (!finalSurveyorSignature) {
      setError('Surveyor signature is required.');
      console.log('Validation failed: Surveyor signature missing');
      setIsSubmitting(false);
      return;
    }

    const fd = new FormData();
    fd.append('farmerId', farmer._id);
    fd.append('pumpNoUnique', pumpNoUnique);
    fd.append('motorNoUnique', motorNoUnique);
    fd.append('controllerNoUnique', controllerNoUnique);
    fd.append('imeiNoUnique', imeiNoUnique);
    fd.append('panels', JSON.stringify(nonEmptyPanels));
    fd.append('additionalItems', JSON.stringify(additionalItems.map(x => x.code)));
    fd.append('installationDoneYesNo', installationDoneYesNo);
    fd.append('pumpNotOperatingYesNo', pumpNotOperatingYesNo);
    fd.append('companyAssignedPersonName', companyAssignedPersonName);

    if (pumpNotOperatingYesNo === 'No' && showComplaintSection) {
      fd.append('complaintIssue', complaintIssue);
      fd.append('complaintRaisedDate', complaintRaisedDate);
      fd.append('complaintNumber', complaintNumber);
      fd.append('applicationStatus', 'Complaint Raised');
    } else {
      fd.append('applicationStatus', 'Installation Completed');
    }

    if (finalFarmerPhoto) fd.append('finalFarmerPhoto', finalFarmerPhoto);
    finalSitePhotos.forEach(f => fd.append('finalSitePhotos', f));
    if (finalSignature) fd.append('finalSignature', finalSignature);
    if (finalSurveyorSignature) fd.append('finalSurveyorSignature', finalSurveyorSignature);

    const formDataEntries = {};
    for (let [key, value] of fd.entries()) {
      formDataEntries[key] = value instanceof File ? `File: ${value.name}` : value;
    }
    console.log('FormData being sent:', formDataEntries);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        console.log('Error: Token missing');
        setIsSubmitting(false);
        return;
      }

      const res = await axios.post(
        `${API_URL}/api/installation/complete-installation`,
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          opsynqDraftKey: draftKey,
        }
      );

      console.log('Backend response:', res.data);
      if (res?.data?.queued || res?.status === 202) {
        setError('');
        onInstallationComplete?.({ ...farmer, offlineQueued: true });
        handleClose();
        return;
      }
      await deleteFieldDraft(draftKey);
      setDraftSavedAt(null);
      onInstallationComplete(res.data.updatedFarmer);
      resetForm();
      handleClose();
    } catch (err) {
      console.error('Error completing installation:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to complete installation. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      backdrop="static"
      className="installation-modal"
      centered
      scrollable
    >
      <Modal.Header closeButton>
        <div>
          <Modal.Title>Installation Completion · {farmer?.beneficiaryName}</Modal.Title>
          <div className="installation-draft-state">{navigator.onLine ? 'Online' : 'Offline'} · {draftSavedAt ? `Draft saved ${new Date(draftSavedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}` : 'Draft protection active'}</div>
        </div>
        <div className="header-controls">
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={expandAll}
            className="btn-header"
          >
            <Expand size={16} />
            Expand All
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={collapseAll}
            className="btn-header"
          >
            <Minimize size={16} />
            Collapse All
          </Button>
        </div>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle className="alert-icon" size={20} />
            <div>{error}</div>
          </div>
        )}
        {(finalFarmerPhoto || finalSitePhotos.length > 0) && <div className="installation-upload-summary">Evidence ready · {1 + finalSitePhotos.length} photo{finalSitePhotos.length ? 's' : ''} · {formatBytes(totalFileBytes([finalFarmerPhoto, ...finalSitePhotos].filter(Boolean)))}{optimisingPhotos ? ' · Optimising…' : ''}</div>}
        
        <Accordion activeKey={openKeys} alwaysOpen>
          <Accordion.Item eventKey="0">
            <Accordion.Header onClick={() => toggleKey('0')}>
              <User size={20} style={{ marginRight: '8px' }} />
              Inspection Details
            </Accordion.Header>
            <Accordion.Body>
              <Row className="inspection-data">
                {Object.entries({
                  beneficiaryId: farmer?.beneficiaryId,
                  aadharNo: farmer?.aadharNo,
                  alternateMobileNumber: farmer?.alternateMobileNumber,
                  applicationStatus: farmer?.applicationStatus,
                  assignedVendorCompanyName: farmer?.assignedVendorCompanyName,
                  casteCategory: farmer?.casteCategory,
                  circleName: farmer?.circleName,
                  controllerTypeWithOrWithout: farmer?.controllerTypeWithOrWithout,
                  createdAt: farmer?.createdAt?.substr(0, 10),
                  district: farmer?.district,
                  divisionName: farmer?.divisionName,
                  excelFileName: farmer?.excelFileName,
                  excelUploadDate: farmer?.excelUploadDate?.substr(0, 10),
                  inspectionStatus: farmer?.inspectionStatus,
                  landAddress: farmer?.landAddress,
                  mobile: farmer?.mobile,
                  pumpHP: farmer?.pumpHP,
                  pumpType: farmer?.pumpType,
                  siteDepth: farmer?.siteDepth,
                  siteLocation: farmer?.siteLocation,
                  surveyDate: farmer?.surveyDate?.substr(0, 10),
                  surveyorName: `${farmer?.surveyorName} (${farmer?.surveyorMobile})`,
                  taluka: farmer?.taluka,
                  village: farmer?.village,
                  zoneName: farmer?.zoneName,
                  actualHeadM: farmer?.actualHeadM,
                  deviationRemarks: farmer?.deviationRemarks,
                  jsrDeviationYesNo: farmer?.jsrDeviationYesNo,
                  landHoldingAcre: farmer?.landHoldingAcre,
                  landOwnershipType: farmer?.landOwnershipType,
                  sourceDepthFeet: farmer?.sourceDepthFeet,
                  updatedAt: farmer?.updatedAt?.substr(0, 10),
                  vendorAssignmentDate: farmer?.vendorAssignmentDate?.substr(0, 10),
                }).map(([label, val]) => (
                  <Col xs={12} sm={6} md={4} key={label} className="mb-3">
                    <div className="info-item">
                      <strong>{formatFieldName(label)}:</strong>
                      <div className="value">{val ?? '—'}</div>
                    </div>
                  </Col>
                ))}
                
                {farmer?.farmerPhotoUrl && (
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <div className="info-item">
                      <strong>Farmer Photo:</strong>
                      <div className="value">
                        <Image 
                          src={resolveAssetUrl(farmer.farmerPhotoUrl)} 
                          thumbnail 
                          className="info-image" 
                          style={{ width: '140px', marginTop: '8px' }}
                        />
                      </div>
                    </div>
                  </Col>
                )}
                
                {farmer?.signatureUrl && (
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <div className="info-item">
                      <strong>Signature:</strong>
                      <div className="value">
                        <Image 
                          src={resolveAssetUrl(farmer.signatureUrl)} 
                          thumbnail 
                          className="info-image" 
                          style={{ width: '140px', marginTop: '8px' }}
                        />
                      </div>
                    </div>
                  </Col>
                )}
                
                {farmer?.sitePhotosUrls?.length > 0 && (
                  <Col xs={12} className="mb-3">
                    <div className="info-item">
                      <strong>Site Photos:</strong>
                      <div className="site-photos">
                        {farmer.sitePhotosUrls.map((url, index) => (
                          <Image 
                            key={index} 
                            src={resolveAssetUrl(url)} 
                            thumbnail 
                            className="site-photo" 
                            style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                          />
                        ))}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header onClick={() => toggleKey('1')}>
              <Wrench size={20} style={{ marginRight: '8px' }} />
              Installation Details
            </Accordion.Header>
            <Accordion.Body>
              <Form onSubmit={handleSubmit}>
                {/* Opsynq issued inventory — visible only for globally mapped farmers */}
                {(inventoryLoading || issuedInventory.linked) && (
                  <div className="form-section issued-inventory-section">
                    <div className="issued-inventory-head">
                      <div>
                        <h6><PackageCheck size={18} /> Issued Material</h6>
                        <p>{inventoryLoading ? 'Checking technician custody…' : 'Use only material issued to you for this work package. Serial ownership is verified again when you submit.'}</p>
                      </div>
                      {!inventoryLoading && <span className="inventory-count">{issuedInventory.items?.length || 0} serialized assets</span>}
                    </div>
                    {!inventoryLoading && issuedInventory.linked && (
                      <div className="beneficiary-scan-box">
                        <div className="beneficiary-scan-copy">
                          <strong><ScanLine size={17} /> Scan material for this beneficiary</strong>
                          <span>Use a barcode/QR handheld scanner or type the serial/barcode and press Enter. Nothing is installed until final submission.</span>
                        </div>
                        <div className="beneficiary-scan-form">
                          <Form.Control
                            value={scanCode}
                            onChange={e => setScanCode(e.target.value)}
                            placeholder="Scan serial / barcode / QR"
                            autoComplete="off"
                            enterKeyHint="done"
                            aria-label="Scan serial or barcode for beneficiary installation"
                          />
                          <Button type="button" onClick={scanIssuedMaterial} disabled={!scanCode.trim() || scanLoading}>{scanLoading ? 'Checking…' : 'Add item'}</Button>
                          <Button type="button" variant="outline-secondary" className="scan-camera-button" onClick={() => setScanCameraOpen(v => !v)}><Camera size={16} /> {scanCameraOpen ? 'Stop camera' : 'Scan with camera'}</Button>
                        </div>
                        {scanCameraOpen && <div className="installer-camera-scan"><video ref={scanVideoRef} playsInline muted /><span>Point the rear camera at the barcode or QR code. It will validate automatically.</span></div>}
                        {scanCameraError && <div className="scan-camera-error" role="status">{scanCameraError}</div>}
                        {scanMessage && <div className="scan-success" role="status"><Check size={15} /> {scanMessage}</div>}
                        {Object.keys(scanDetails).length > 0 && <div className="scan-detail-grid" aria-label="Last scanned asset details">{Object.entries(scanDetails).filter(([,v])=>v!==''&&v!=null).slice(0,8).map(([k,v])=><span key={k}><small>{formatFieldName(k)}</small><strong>{String(v)}</strong></span>)}</div>}
                        <div className="beneficiary-selection-summary" aria-label="Material selected for this beneficiary">
                          <span><small>Pump</small><strong>{pumpNoUnique ? '1' : '0'}</strong></span>
                          <span><small>Motor</small><strong>{motorNoUnique ? '1' : '0'}</strong></span>
                          <span><small>Controller</small><strong>{controllerNoUnique ? '1' : '0'}</strong></span>
                          <span><small>Panels</small><strong>{panelsArray.filter(x => String(x || '').trim()).length}</strong></span>
                          <span><small>Other</small><strong>{additionalItems.length}</strong></span>
                        </div>
                        {additionalItems.length > 0 && (
                          <div className="additional-install-items">
                            <strong>Additional serialized items ({additionalItems.length})</strong>
                            {additionalItems.map(item => (
                              <div key={item.code} className="additional-install-row">
                                <div><span>{item.name}</span><code>{item.code}</code></div>
                                <button type="button" onClick={() => setAdditionalItems(prev => prev.filter(x => x.code !== item.code))} aria-label={`Remove ${item.code}`}><X size={15} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {!inventoryLoading && issuedInventory.items?.length > 0 ? (
                      <div className="issued-inventory-grid">
                        {issuedInventory.items.map(item => (
                          <div className="issued-inventory-item" key={item._id}>
                            <div>
                              <strong>{inventoryRole(item)}</strong>
                              <span>{item.itemId?.name || item.itemId?.sku || 'Serialized material'}</span>
                              <code>{item.serialNumber || item.barcodeValue}</code>
                            </div>
                            <Button type="button" className="btn-use-issued" onClick={() => useIssuedSerial(item)}>
                              <ScanLine size={15} /> Use
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : !inventoryLoading ? (
                      <div className="inventory-empty-state">No serialized material is currently issued to this technician for the mapped farmer/work package.</div>
                    ) : null}
                  </div>
                )}

                {/* Equipment Details */}
                <div className="form-section">
                  <h6>Equipment Details</h6>
                  <Row>
                    <Col xs={12} sm={6} md={3} className="mb-3">
                      <Form.Group controlId="pumpNoUnique">
                        <Form.Label>
                          Pump Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={pumpNoUnique}
                          onChange={e => setPumpNoUnique(e.target.value)}
                          required
                          placeholder="Enter pump number"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3} className="mb-3">
                      <Form.Group controlId="motorNoUnique">
                        <Form.Label>
                          Motor Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={motorNoUnique}
                          onChange={e => setMotorNoUnique(e.target.value)}
                          required
                          placeholder="Enter motor number"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3} className="mb-3">
                      <Form.Group controlId="controllerNoUnique">
                        <Form.Label>
                          Controller Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={controllerNoUnique}
                          onChange={e => setControllerNoUnique(e.target.value)}
                          required
                          placeholder="Enter controller number"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={3} className="mb-3">
                      <Form.Group controlId="imeiNoUnique">
                        <Form.Label>
                          IMEI Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={imeiNoUnique}
                          onChange={e => setImeiNoUnique(e.target.value)}
                          required
                          placeholder="Enter IMEI number"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Panel Serial Numbers */}
                <div className="form-section">
                  <h6>Panel Serial Numbers</h6>
                  {panelsArray.map((panel, index) => (
                    <div key={index} className="panel-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        <Form.Group controlId={`panel-${index}`}>
                          <Form.Label>Panel {index + 1} Serial Number</Form.Label>
                          <Form.Control
                            type="text"
                            value={panel}
                            onChange={e => handlePanelChange(index, e.target.value)}
                            placeholder={`Enter panel ${index + 1} serial number`}
                          />
                        </Form.Group>
                      </div>
                      <Button
                        variant="danger"
                        onClick={() => removePanelField(index)}
                        className="btn-remove-panel"
                        disabled={panelsArray.length === 1}
                      >
                        <Trash2 size={16} />
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={addPanelField}
                    className="btn-add-panel"
                  >
                    <Plus size={16} />
                    Add Panel
                  </Button>
                </div>

                {/* Installation Status */}
                <div className="form-section">
                  <h6>Installation Status</h6>
                  <Row>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="installationDoneYesNo">
                        <Form.Label>
                          Installation Completed? <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          value={installationDoneYesNo}
                          onChange={e => setInstallationDoneYesNo(e.target.value)}
                          required
                        >
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="pumpNotOperatingYesNo">
                        <Form.Label>
                          Pump Operating? <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          value={pumpNotOperatingYesNo}
                          onChange={e => {
                            setPumpNotOperatingYesNo(e.target.value);
                            if (e.target.value !== 'No') {
                              setShowComplaintSection(false);
                              setComplaintIssue('');
                              setComplaintRaisedDate('');
                              setComplaintNumber('');
                            }
                          }}
                          required
                        >
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} md={4} className="mb-3">
                      <Form.Group controlId="companyAssignedPersonName">
                        <Form.Label>
                          Assigned Person Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={companyAssignedPersonName}
                          onChange={e => setCompanyAssignedPersonName(e.target.value)}
                          required
                          placeholder="Enter name"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Complaint Section */}
                {pumpNotOperatingYesNo === 'No' && (
                  <div className="form-section complaint-section">
                    {!showComplaintSection ? (
                      <Button
                        type="button"
                        onClick={() => setShowComplaintSection(true)}
                        className="btn-raise-complaint"
                      >
                        <AlertTriangle size={20} />
                        Raise Complaint
                      </Button>
                    ) : (
                      <>
                        <h6>Complaint Details</h6>
                        <Row>
                          <Col xs={12} className="mb-3">
                            <Form.Group controlId="complaintIssue">
                              <Form.Label>
                                Complaint Issue <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={4}
                                value={complaintIssue}
                                onChange={e => setComplaintIssue(e.target.value)}
                                required
                                placeholder="Describe the issue"
                              />
                            </Form.Group>
                          </Col>
                          <Col xs={12} sm={6} className="mb-3">
                            <Form.Group controlId="complaintRaisedDate">
                              <Form.Label>
                                Complaint Raised Date <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="date"
                                value={complaintRaisedDate}
                                onChange={e => setComplaintRaisedDate(e.target.value)}
                                max={new Date().toISOString().slice(0, 10)}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col xs={12} sm={6} className="mb-3">
                            <Form.Group controlId="complaintNumber">
                              <Form.Label>
                                Complaint Number <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="text"
                                value={complaintNumber}
                                onChange={e => setComplaintNumber(e.target.value)}
                                required
                                placeholder="Enter complaint number"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </>
                    )}
                  </div>
                )}

                {/* Upload Photos */}
                <div className="form-section">
                  <h6>Upload Photos</h6>
                  <Row>
                    <Col xs={12} sm={6} className="mb-3">
                      <Form.Group controlId="finalFarmerPhoto">
                        <Form.Label>
                          <Camera size={16} style={{ marginRight: '8px' }} />
                          Final Farmer Photo
                        </Form.Label>
                        <div className="file-upload-container">
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={onFarmerPhotoChange}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <Form.Group controlId="finalSitePhotos">
                        <Form.Label>
                          <FileImage size={16} style={{ marginRight: '8px' }} />
                          Final Site Photos
                        </Form.Label>
                        <div className="file-upload-container">
                          <Form.Control
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onSitePhotosChange}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Signatures */}
                <div className="form-section">
                  <h6>
                    <PenTool size={20} style={{ marginRight: '8px' }} />
                    Signatures <span className="text-danger">*</span>
                  </h6>
                  <Row>
                    <Col xs={12} sm={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Farmer Signature</Form.Label>
                        <div className="signature-container">
                          <SignatureCanvas
                            penColor="black"
                            canvasProps={{ className: 'signature-canvas' }}
                            ref={farmerSigRef}
                          />
                          <div className="signature-actions">
                            <Button
                              type="button"
                              className="btn-signature btn-signature-clear"
                              onClick={() => {
                                farmerSigRef.current.clear();
                                setFarmerSigPreview(null);
                                setFinalSignature(null);
                              }}
                            >
                              <RotateCcw size={16} />
                              Clear
                            </Button>
                            <Button
                              type="button"
                              className="btn-signature btn-signature-capture"
                              onClick={captureFarmerSig}
                            >
                              <Check size={16} />
                              Capture
                            </Button>
                          </div>
                          {farmerSigPreview && (
                            <div className="signature-preview-container">
                              <strong>Captured Signature:</strong>
                              <Image 
                                src={farmerSigPreview} 
                                className="signature-preview" 
                              />
                            </div>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} sm={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Surveyor Signature</Form.Label>
                        <div className="signature-container">
                          <SignatureCanvas
                            penColor="black"
                            canvasProps={{ className: 'signature-canvas' }}
                            ref={surveyorSigRef}
                          />
                          <div className="signature-actions">
                            <Button
                              type="button"
                              className="btn-signature btn-signature-clear"
                              onClick={() => {
                                surveyorSigRef.current.clear();
                                setSurveyorSigPreview(null);
                                setFinalSurveyorSignature(null);
                              }}
                            >
                              <RotateCcw size={16} />
                              Clear
                            </Button>
                            <Button
                              type="button"
                              className="btn-signature btn-signature-capture"
                              onClick={captureSurveyorSig}
                            >
                              <Check size={16} />
                              Capture
                            </Button>
                          </div>
                          {surveyorSigPreview && (
                            <div className="signature-preview-container">
                              <strong>Captured Signature:</strong>
                              <Image 
                                src={surveyorSigPreview} 
                                className="signature-preview" 
                              />
                            </div>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <Button 
                    type="button"
                    onClick={handleClose}
                    className="btn-action btn-cancel"
                    disabled={isSubmitting}
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className={`btn-action btn-submit ${isSubmitting ? 'loading' : ''}`}
                    disabled={!finalSignature || !finalSurveyorSignature || isSubmitting}
                  >
                    {!isSubmitting && <Save size={16} />}
                    {isSubmitting ? 'Submitting...' : 'Submit Installation'}
                  </Button>
                </div>
              </Form>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Modal.Body>
    </Modal>
  );
}