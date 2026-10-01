// OrderConfirmationModal.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';

import { API_URL, resolveAssetUrl } from '../config.js';
import './OrderConfirmationModal.css';


const dataUrlToBlob = (dataUrl) => {
  const [header, payload] = String(dataUrl || '').split(',');
  const mime = header?.match(/data:([^;]+)/)?.[1] || 'image/png';
  const binary = atob(payload || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

const materialRole = (item) => {
  const text = `${item?.itemId?.category || ''} ${item?.itemId?.name || ''} ${item?.itemId?.sku || ''}`.toLowerCase();
  if (text.includes('pump')) return 'PUMP';
  if (text.includes('motor')) return 'MOTOR';
  if (text.includes('controller') || text.includes('inverter')) return 'CONTROLLER';
  if (text.includes('panel') || text.includes('module')) return 'PANEL';
  return 'OTHER';
};


export default function OrderConfirmationModal({
  show,
  handleClose,
  farmer,               // the entire farmer object from props
  onOrderConfirmed,     // callback to parent for refreshing
  technicianUsername,
}) {
  const today = new Date().toISOString().split('T')[0]; // e.g. "2025-05-31"

  // ─── Initialize local form state from any existing farmer data ─────────────────
  const [formData, setFormData] = useState({
    fullSetOrPartialSet: farmer?.fullSetOrPartialSet || '',
    materialDispatchDate: farmer?.materialDispatchDate
      ? farmer.materialDispatchDate.substr(0, 10)
      : today,

    materialReceivedConfirmationYesNo:
      farmer?.materialReceivedConfirmationYesNo || '',
    // THIS is the new Date field we added to schema (must match exactly)
    materialReceivedDate: farmer?.materialReceivedDate
      ? farmer.materialReceivedDate.substr(0, 10)
      : today,

    shortageDamagedRemarks: farmer?.shortageDamagedRemarks || '',

    pumpNoUnique: farmer?.pumpNoUnique || '',
    motorNoUnique: farmer?.motorNoUnique || '',
    controllerNoUnique: farmer?.controllerNoUnique || '',
    imeiNoUnique: farmer?.imeiNoUnique || '',

    panels: farmer?.panels?.length > 0 ? farmer.panels : [''],

    orderReceivedByTechnician: `${farmer?.surveyorName || ''} (${
      farmer?.surveyorMobile || ''
    })`.trim(),
    orderReceivedConfirmationYesNo: farmer?.orderReceivedConfirmationYesNo || '',
    orderReceivedDate: farmer?.orderReceivedDate
      ? farmer.orderReceivedDate.substr(0, 10)
      : today,
    orderReceivedRemarks: farmer?.orderReceivedRemarks || '',
    orderReceivedYesNo: farmer?.orderReceivedYesNo || '',

    // URLs (arrays of strings) for any LR photos
    lrPhotoUrls: farmer?.lrPhotoUrls || [],

    // Signature URLs (strings)
    finalsignatureUrl: farmer?.finalsignatureUrl || '',
    finalsurveyorsignatureUrl: farmer?.finalsurveyorsignatureUrl || '',
  });

  const [error, setError] = useState('');
  const [issuedInventory, setIssuedInventory] = useState({ linked: false, items: [] });
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [panelScanCode, setPanelScanCode] = useState('');
  const [scanMode, setScanMode] = useState('ANY');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [verifiedReceiptItems, setVerifiedReceiptItems] = useState({});
  const [scanCameraOpen, setScanCameraOpen] = useState(false);
  const [scanCameraError, setScanCameraError] = useState('');
  const scanVideoRef = useRef(null);
  const token = localStorage.getItem('token');
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // Refs for signature pads
  const farmerSigPad = useRef(null);
  const surveyorSigPad = useRef(null);


  useEffect(() => {
    if (!show || !farmer?._id) return;
    const technicianLabel = String(technicianUsername || localStorage.getItem('username') || farmer?.surveyorName || '').trim();
    const technicianMobile = String(localStorage.getItem('mobile') || farmer?.surveyorMobile || '').trim();
    setFormData({
      fullSetOrPartialSet: farmer?.fullSetOrPartialSet || 'Full Set',
      materialDispatchDate: farmer?.materialDispatchDate ? String(farmer.materialDispatchDate).slice(0, 10) : today,
      materialReceivedConfirmationYesNo: farmer?.materialReceivedConfirmationYesNo || 'Yes',
      materialReceivedDate: farmer?.materialReceivedDate ? String(farmer.materialReceivedDate).slice(0, 10) : today,
      shortageDamagedRemarks: farmer?.shortageDamagedRemarks || '',
      pumpNoUnique: farmer?.pumpNoUnique || '',
      motorNoUnique: farmer?.motorNoUnique || '',
      controllerNoUnique: farmer?.controllerNoUnique || '',
      imeiNoUnique: farmer?.imeiNoUnique || '',
      panels: farmer?.panels?.length > 0 ? farmer.panels.map((x) => String(x || '')) : [''],
      orderReceivedByTechnician: technicianMobile ? `${technicianLabel} (${technicianMobile})` : technicianLabel,
      orderReceivedConfirmationYesNo: farmer?.orderReceivedConfirmationYesNo || 'Yes',
      orderReceivedDate: farmer?.orderReceivedDate ? String(farmer.orderReceivedDate).slice(0, 10) : today,
      orderReceivedRemarks: farmer?.orderReceivedRemarks || '',
      orderReceivedYesNo: farmer?.orderReceivedYesNo || 'Yes',
      lrPhotoUrls: farmer?.lrPhotoUrls || [],
      finalsignatureUrl: farmer?.finalsignatureUrl || '',
      finalsurveyorsignatureUrl: farmer?.finalsurveyorsignatureUrl || '',
    });
    setIssuedInventory({ linked: false, items: [] });
    setScanCode('');
    setPanelScanCode('');
    setScanMode('ANY');
    setScanMessage('');
    setVerifiedReceiptItems({});
    setScanCameraError('');
    setError('');
  }, [show, farmer?._id, technicianUsername]);

  const applyIssuedItem = (item, { expectedRole = '', markVerified = true } = {}) => {
    const code = String(item?.serialNumber || item?.barcodeValue || '').trim();
    if (!code) return;
    const role = item?.role || materialRole(item);
    if (expectedRole && role !== expectedRole) { setError(`Scanned item is ${role.toLowerCase()}, not a ${expectedRole.toLowerCase()}. Scan the correct serialized asset.`); return false; }
    const currentCodes = [formData.pumpNoUnique, formData.motorNoUnique, formData.controllerNoUnique, ...(formData.panels || [])]
      .map((x) => String(x || '').trim().toLowerCase()).filter(Boolean);
    if (currentCodes.includes(code.toLowerCase())) {
      if (markVerified) { setVerifiedReceiptItems(prev => ({ ...prev, [code.toLowerCase()]: { code, condition: prev[code.toLowerCase()]?.condition || 'GOOD', item } })); setScanMessage(`${code} physically verified for this beneficiary.`); return true; }
      return false;
    }
    const attrs = item?.scanAttributes || item?.metadata?.scanAttributes || item?.agencyReceiptAttributes || {};
    setFormData((prev) => {
      if (role === 'PUMP') return { ...prev, pumpNoUnique: code };
      if (role === 'MOTOR') return { ...prev, motorNoUnique: code };
      if (role === 'CONTROLLER') return {
        ...prev,
        controllerNoUnique: code,
        imeiNoUnique: prev.imeiNoUnique || String(attrs.imei || attrs.IMEI || attrs.imeiNo || attrs.imeiNumber || ''),
      };
      if (role === 'PANEL') {
        const panels = [...(prev.panels || [''])];
        const empty = panels.findIndex((x) => !String(x || '').trim());
        if (empty >= 0) panels[empty] = code;
        else panels.push(code);
        return { ...prev, panels };
      }
      return prev;
    });
    if (markVerified) setVerifiedReceiptItems(prev => ({ ...prev, [code.toLowerCase()]: { code, condition: prev[code.toLowerCase()]?.condition || 'GOOD', item } }));
    setScanMessage(markVerified ? `${role === 'PANEL' ? 'Solar panel' : role.charAt(0) + role.slice(1).toLowerCase()} ${code} physically verified against issued material.` : `${role === 'PANEL' ? 'Solar panel' : role.charAt(0) + role.slice(1).toLowerCase()} ${code} expected for this beneficiary.`);
    return true;
  };

  useEffect(() => {
    if (!show || !farmer?._id) return;
    let active = true;
    const loadIssued = async () => {
      setInventoryLoading(true);
      setScanMessage('');
      try {
        const resp = await axios.get(`${API_URL}/api/installation/issued-material/${farmer._id}`, auth);
        if (!active) return;
        const data = resp.data || { linked: false, items: [] };
        setIssuedInventory(data);
        (data.items || []).filter((item) => item.assignmentScope === 'BENEFICIARY').forEach((item) => applyIssuedItem(item, { markVerified: false }));
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load issued material for this beneficiary.');
      } finally {
        if (active) setInventoryLoading(false);
      }
    };
    loadIssued();
    return () => { active = false; };
  }, [show, farmer?._id]);

  const submitScan = async (rawValue, { expectedRole = '' } = {}) => {
    const code = String(rawValue ?? scanCode).trim();
    if (!code || !farmer?._id || scanLoading) return;
    setScanLoading(true);
    setError('');
    setScanMessage('');
    try {
      const resp = await axios.post(
        `${API_URL}/api/installation/scan-issued-material/${farmer._id}`,
        { code },
        auth
      );
      const added = applyIssuedItem(resp.data?.item || {}, { expectedRole });
      if (added) {
        if (expectedRole === 'PANEL') setPanelScanCode('');
        else setScanCode('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Scanned material is not valid for this technician/beneficiary.');
    } finally {
      setScanLoading(false);
    }
  };

  useEffect(() => {
    if (!scanCameraOpen) return;
    let stream; let stopped = false; let frame;
    const start = async () => {
      try {
        setScanCameraError('');
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is unavailable. Use a Bluetooth/USB scanner or type the serial.');
        if (!('BarcodeDetector' in window)) throw new Error('Camera barcode decoding is not supported in this browser. Bluetooth/USB scanner input still works.');
        const detector = new window.BarcodeDetector({ formats: ['qr_code','code_128','code_39','ean_13','ean_8','upc_a','upc_e','data_matrix'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (scanVideoRef.current) { scanVideoRef.current.srcObject = stream; await scanVideoRef.current.play(); }
        const tick = async () => {
          if (stopped) return;
          try {
            const found = await detector.detect(scanVideoRef.current);
            const raw = found?.[0]?.rawValue;
            if (raw) {
              stopped = true;
              setScanCameraOpen(false);
              if (scanMode === 'PANEL') setPanelScanCode(raw); else setScanCode(raw);
              await submitScan(raw, { expectedRole: scanMode === 'PANEL' ? 'PANEL' : '' });
              return;
            }
          } catch {}
          frame = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        setScanCameraError(e.message);
        setScanCameraOpen(false);
      }
    };
    start();
    return () => {
      stopped = true;
      if (frame) cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanCameraOpen, scanMode]);

  // ─── Handlers for form inputs ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePanelChange = (idx, val) => {
    setFormData((prev) => {
      const newPanels = [...prev.panels];
      newPanels[idx] = val;
      return { ...prev, panels: newPanels };
    });
  };

  const addPanel = () => {
    setFormData((prev) => ({ ...prev, panels: [...prev.panels, ''] }));
  };
  const removePanel = (idx) => {
    setFormData((prev) => {
      const newList = prev.panels.filter((_, i) => i !== idx);
      return { ...prev, panels: newList.length ? newList : [''] };
    });
  };

  // ─── Upload LR Photos to your /api/farmers/upload endpoint ───────────────────
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) {
      setError('No files selected.');
      return;
    }
    const uploadData = new FormData();
    files.forEach((file) => uploadData.append('files', file));

    try {
      console.log('Uploading LR photos to /api/farmers/upload', { fileCount: files.length });
      const resp = await axios.post(
        `${API_URL}/api/farmers/upload`,
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          params: { folder: 'Opsynq/Order_Received/LR_Photos' },
        }
      );
      const uploadedUrls = resp.data.urls || [];
      setFormData((prev) => ({
        ...prev,
        lrPhotoUrls: [...prev.lrPhotoUrls, ...uploadedUrls],
      }));
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to upload LR photos: ${msg}`);
      console.error('File upload error:', msg);
    }
  };

  // ─── Save a drawn signature to cloud, then place its URL into formData ──────
  const handleSignatureSave = async (fieldName, sigPadRef) => {
    if (sigPadRef.current.isEmpty()) {
      setError(
        `Please provide a signature for ${
          fieldName === 'finalsignatureUrl' ? 'Farmer' : 'Surveyor'
        }.`
      );
      return;
    }
    try {
      const dataUrl = sigPadRef.current.toDataURL('image/png');
      const blob = dataUrlToBlob(dataUrl);
      const uploadData = new FormData();
      uploadData.append('files', blob, `${fieldName}-${Date.now()}.png`);

      console.log(`Uploading ${fieldName} signature to /api/farmers/upload`);
      const resp = await axios.post(
        `${API_URL}/api/farmers/upload`,
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          params: { folder: 'Opsynq/Order_Received/Signatures' },
        }
      );
      const uploadedUrl = resp.data.urls[0];
      setFormData((prev) => ({ ...prev, [fieldName]: uploadedUrl }));
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(
        `Failed to upload ${
          fieldName === 'finalsignatureUrl' ? 'Farmer' : 'Surveyor'
        } signature: ${msg}`
      );
      console.error('Signature upload error:', msg);
    }
  };

  const clearSignature = (fieldName, sigPadRef) => {
    sigPadRef.current.clear();
    setFormData((prev) => ({ ...prev, [fieldName]: '' }));
  };

  // ─── Main submit: PUT → /api/farmers/:id with ALL fields at top level ─────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that required fields are non-empty
    const required = ['fullSetOrPartialSet','materialDispatchDate','materialReceivedDate','orderReceivedByTechnician','orderReceivedDate','finalsignatureUrl','finalsurveyorsignatureUrl'];
    if (required.some((f) => !formData[f])) { setError('Receipt type, dates and both signatures are required.'); return; }
    if (!issuedInventory.linked && (!formData.pumpNoUnique || !formData.motorNoUnique || !formData.controllerNoUnique || !formData.imeiNoUnique || formData.panels.some((p) => !p.trim()))) { setError('All legacy equipment fields, panels and IMEI are required when governed inventory is unavailable.'); return; }
    const verified = Object.values(verifiedReceiptItems);
    if (issuedInventory.linked && !verified.length) { setError('Scan the material physically received before confirming beneficiary custody. Prefilled serials are expected items, not receipt confirmation.'); return; }
    const receivedCodes = verified.filter(x => x.condition === 'GOOD').map(x => x.code);
    const damagedCodes = verified.filter(x => x.condition === 'DAMAGED').map(x => x.code);

    try {
      const payload = {
        fullSetOrPartialSet: formData.fullSetOrPartialSet,
        materialDispatchDate: new Date(formData.materialDispatchDate).toISOString(),
        materialReceivedDate: new Date(formData.materialReceivedDate).toISOString(),
        remarks: formData.shortageDamagedRemarks,
        imeiNoUnique: formData.imeiNoUnique,
        orderReceivedByTechnician: formData.orderReceivedByTechnician,
        orderReceivedDate: new Date(formData.orderReceivedDate).toISOString(),
        orderReceivedRemarks: formData.orderReceivedRemarks,
        lrPhotoUrls: formData.lrPhotoUrls,
        farmerSignatureUrl: formData.finalsignatureUrl,
        technicianSignatureUrl: formData.finalsurveyorsignatureUrl,
        receivedCodes,
        damagedCodes,
      };
      const resp = issuedInventory.linked
        ? await axios.post(`${API_URL}/api/installation/confirm-material-receipt/${farmer._id}`, payload, auth)
        : await axios.put(`${API_URL}/api/farmers/${farmer._id}`, { ...formData, applicationStatus: 'Dispatch Completed', confirmedBy: technicianUsername, confirmationDate: new Date().toISOString() }, auth);
      setError('');
      onOrderConfirmed(resp.data?.updatedFarmer || resp.data);
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(`Failed to confirm order receipt: ${msg}`);
      console.error('Database update error:', msg, err.response?.data || err);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <Modal show={show} onHide={handleClose} size="lg" dialogClassName="order-confirmation-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          Confirm Order Receipt for {farmer?.beneficiaryName || 'N/A'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row className="gy-3">
            {/* ─── Full Set / Partial Set ─────────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="fullSetOrPartialSet">
                <Form.Label>Full Set or Partial Set</Form.Label>
                <Form.Select
                  name="fullSetOrPartialSet"
                  value={formData.fullSetOrPartialSet}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Full Set">Full Set</option>
                  <option value="Partial Set">Partial Set</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* ─── Material Dispatch Date (read‐only) ─────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="materialDispatchDate">
                <Form.Label>Material Dispatch Date</Form.Label>
                <Form.Control
                  type="date"
                  name="materialDispatchDate"
                  value={formData.materialDispatchDate}
                  readOnly
                  required
                />
              </Form.Group>
            </Col>

            {/* ─── Material Received Confirmation Yes/No ───────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="materialReceivedConfirmationYesNo">
                <Form.Label>Material Received Confirmation</Form.Label>
                <Form.Select
                  name="materialReceivedConfirmationYesNo"
                  value={formData.materialReceivedConfirmationYesNo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* ─── Material Received Date (read‐only) ──────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="materialReceivedDate">
                <Form.Label>Material Received Date</Form.Label>
                <Form.Control
                  type="date"
                  name="materialReceivedDate"
                  value={formData.materialReceivedDate}
                  readOnly
                  required
                />
              </Form.Group>
            </Col>

            {/* ─── Shortage / Damaged Remarks ──────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="shortageDamagedRemarks">
                <Form.Label>Shortage / Damaged Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="shortageDamagedRemarks"
                  value={formData.shortageDamagedRemarks}
                  onChange={handleChange}
                  placeholder="Enter any shortage or damaged remarks"
                />
              </Form.Group>
            </Col>


            <Col md={12}>
              <div className="order-issued-material">
                <div className="order-issued-material__head">
                  <div>
                    <strong>Issued material verification</strong>
                    <small>{inventoryLoading ? 'Loading assigned material…' : issuedInventory.linked ? `${issuedInventory.items?.length || 0} serialized item(s) available · beneficiary-bound items are prefilled, work-package stock is confirmed by scan.` : 'No governed issued inventory is linked; legacy manual entry remains available.'}</small>
                  </div>
                </div>
                <div className="order-scan-row">
                  <Form.Control
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitScan(); } }}
                    placeholder="Scan barcode / QR / serial"
                    aria-label="Scan material serial"
                  />
                  <Button type="button" variant="outline-primary" disabled={scanLoading} onClick={() => submitScan()}>
                    {scanLoading ? 'Checking…' : 'Add scan'}
                  </Button>
                  <Button type="button" variant="outline-secondary" onClick={() => { setScanMode('ANY'); setScanCameraOpen((v) => !v); }}>
                    {scanCameraOpen ? 'Stop camera' : 'Camera scan'}
                  </Button>
                </div>
                {scanCameraOpen && scanMode === 'ANY' && <div className="order-camera-scan"><video ref={scanVideoRef} playsInline muted /><small>Point the rear camera at the barcode or QR. Capture is automatic.</small></div>}
                {scanCameraError && <Alert variant="warning" className="mt-2 mb-0">{scanCameraError}</Alert>}
                {scanMessage && <Alert variant="success" className="mt-2 mb-0">{scanMessage}</Alert>}
                {!!issuedInventory.items?.length && <div className="order-issued-list">
                  {issuedInventory.items.map((item) => {
                    const code = String(item.serialNumber || item.barcodeValue || '');
                    const verified = verifiedReceiptItems[code.toLowerCase()];
                    return <div key={item._id || item.serialNumber} className={verified ? 'is-verified' : ''}>
                      <span><b>{item.itemId?.name || item.itemId?.sku || 'Material'}</b><small>{item.assignmentScope === 'BENEFICIARY' ? 'Expected for beneficiary' : 'Available in technician work-package custody'}{item.issueNo ? ` · ${item.issueNo}` : ''}</small></span>
                      <code>{code || '—'}</code>
                      <span className={`receipt-scan-state ${verified ? (verified.condition === 'DAMAGED' ? 'is-damaged' : 'is-good') : ''}`}>{verified ? (verified.condition === 'DAMAGED' ? 'Damaged' : 'Received') : 'Scan to confirm'}</span>
                      {verified && <button type="button" className="receipt-condition-toggle" onClick={() => setVerifiedReceiptItems(prev => ({ ...prev, [code.toLowerCase()]: { ...prev[code.toLowerCase()], condition: prev[code.toLowerCase()]?.condition === 'DAMAGED' ? 'GOOD' : 'DAMAGED' } }))}>{verified.condition === 'DAMAGED' ? 'Mark good' : 'Mark damaged'}</button>}
                    </div>;
                  })}
                </div>}
                <small className="agency-scan-help">Receipt values are prefilled only from beneficiary-bound issued material. Work-package stock must be physically scanned before it is attached to this beneficiary; the same serials are revalidated again at installation.</small>
              </div>
            </Col>

            {/* ─── Pump No Unique ──────────────────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="pumpNoUnique">
                <Form.Label>Pump Number</Form.Label>
                <Form.Control
                  type="text"
                  name="pumpNoUnique"
                  value={formData.pumpNoUnique}
                  onChange={handleChange}
                  placeholder="Enter pump number"
                  required
                />
              </Form.Group>
            </Col>

            {/* ─── Motor No Unique ─────────────────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="motorNoUnique">
                <Form.Label>Motor Number</Form.Label>
                <Form.Control
                  type="text"
                  name="motorNoUnique"
                  value={formData.motorNoUnique}
                  onChange={handleChange}
                  placeholder="Enter motor number"
                  required
                />
              </Form.Group>
            </Col>

            {/* ─── Controller No Unique ───────────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="controllerNoUnique">
                <Form.Label>Controller Number</Form.Label>
                <Form.Control
                  type="text"
                  name="controllerNoUnique"
                  value={formData.controllerNoUnique}
                  onChange={handleChange}
                  placeholder="Enter controller number"
                  required
                />
              </Form.Group>
            </Col>

            {/* ─── IMEI No Unique ─────────────────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="imeiNoUnique">
                <Form.Label>IMEI Number</Form.Label>
                <Form.Control
                  type="text"
                  name="imeiNoUnique"
                  value={formData.imeiNoUnique}
                  onChange={handleChange}
                  placeholder="Enter IMEI number"
                  required
                />
              </Form.Group>
            </Col>

            {/* ─── Panels (dynamic list) ──────────────────────────────────────── */}
            <Col md={12}>
              <div className="order-panel-section">
                <div className="order-panel-section__head">
                  <div><strong>Solar panel serials</strong><small>Scan every panel at receipt. These confirmed serials carry forward to installation for a second verification.</small></div>
                  <span>{formData.panels.filter((x) => String(x || '').trim()).length} captured</span>
                </div>
                <div className="order-panel-scan">
                  <Form.Control
                    value={panelScanCode}
                    onChange={(e) => setPanelScanCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitScan(panelScanCode, { expectedRole: 'PANEL' }); } }}
                    placeholder="Scan solar panel serial / barcode / QR"
                    aria-label="Scan solar panel serial"
                  />
                  <Button type="button" variant="primary" disabled={!panelScanCode.trim() || scanLoading} onClick={() => submitScan(panelScanCode, { expectedRole: 'PANEL' })}>{scanLoading ? 'Checking…' : 'Add panel'}</Button>
                  <Button type="button" variant="outline-secondary" onClick={() => { setScanMode('PANEL'); setScanCameraOpen((v) => !v); }}>{scanCameraOpen && scanMode === 'PANEL' ? 'Stop camera' : 'Camera scan'}</Button>
                </div>
                {scanCameraOpen && scanMode === 'PANEL' && <div className="order-camera-scan"><video ref={scanVideoRef} playsInline muted /><small>Point the rear camera at one solar-panel barcode/QR. Verified panels are added automatically.</small></div>}
                <div className="order-panel-list">
                  {formData.panels.map((panel, idx) => (
                    <div key={idx} className="order-panel-row">
                      <span className="order-panel-index">{idx + 1}</span>
                      <Form.Control type="text" value={panel} onChange={(e) => handlePanelChange(idx, e.target.value)} placeholder={`Panel ${idx + 1} serial number`} required />
                      {formData.panels.length > 1 && <Button variant="outline-danger" size="sm" onClick={() => removePanel(idx)}>Remove</Button>}
                    </div>
                  ))}
                </div>
                <Button variant="outline-secondary" size="sm" onClick={addPanel} className="order-add-panel">Add another panel</Button>
              </div>
            </Col>

            {/* ─── Order Received By Technician (read‐only) ───────────────────── */}
            <Col md={6}>
              <Form.Group controlId="orderReceivedByTechnician">
                <Form.Label>Order Received By Technician</Form.Label>
                <Form.Control
                  type="text"
                  name="orderReceivedByTechnician"
                  value={formData.orderReceivedByTechnician}
                  readOnly
                  required
                />
              </Form.Group>
            </Col>

            {/* ─── Order Received Confirmation Yes/No ─────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="orderReceivedConfirmationYesNo">
                <Form.Label>Order Received Confirmation</Form.Label>
                <Form.Select
                  name="orderReceivedConfirmationYesNo"
                  value={formData.orderReceivedConfirmationYesNo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* ─── Order Received Date (read‐only) ───────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="orderReceivedDate">
                <Form.Label>Order Received Date</Form.Label>
                <Form.Control
                  type="date"
                  name="orderReceivedDate"
                  value={formData.orderReceivedDate}
                  readOnly
                  required
                />
              </Form.Group>
            </Col>

            {/* ─── Order Received Remarks ─────────────────────────────────────── */} 
            <Col md={6}>
              <Form.Group controlId="orderReceivedRemarks">
                <Form.Label>Order Received Remarks</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="orderReceivedRemarks"
                  value={formData.orderReceivedRemarks}
                  onChange={handleChange}
                  placeholder="Enter any order received remarks"
                />
              </Form.Group>
            </Col>

            {/* ─── Order Received Yes/No ──────────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="orderReceivedYesNo">
                <Form.Label>Order Received Yes/No</Form.Label>
                <Form.Select
                  name="orderReceivedYesNo"
                  value={formData.orderReceivedYesNo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* ─── LR Photos upload ───────────────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="lrPhotoUrls">
                <Form.Label>LR Photos</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {formData.lrPhotoUrls.length > 0 && (
                  <div className="order-photo-preview-block">
                    <strong>Uploaded LR photos</strong>
                    <div className="order-photo-grid">
                      {formData.lrPhotoUrls.map((url, idx) => { const src = resolveAssetUrl(url); return (
                        <a key={`${url}-${idx}`} href={src} target="_blank" rel="noopener noreferrer" className="order-photo-card">
                          <img src={src} alt={`LR evidence ${idx + 1}`} loading="lazy" />
                          <span>LR photo {idx + 1}</span>
                        </a>
                      ); })}
                    </div>
                  </div>
                )}
              </Form.Group>
            </Col>

            {/* ─── Farmer’s Signature ─────────────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="finalsignatureUrl">
                <Form.Label>Farmer's Signature</Form.Label>
                <SignatureCanvas
                  ref={farmerSigPad}
                  canvasProps={{
                    className: 'signature-canvas border',
                    width: 300,
                    height: 100,
                  }}
                />
                <div className="mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSignatureSave('finalsignatureUrl', farmerSigPad)}
                  >
                    Save Farmer's Signature
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="ms-2"
                    onClick={() => clearSignature('finalsignatureUrl', farmerSigPad)}
                  >
                    Clear
                  </Button>
                </div>
                {formData.finalsignatureUrl && (
                  <div className="mt-2">
                    <strong>Farmer's Signature:</strong>
                    <img
                      src={resolveAssetUrl(formData.finalsignatureUrl)}
                      alt="Farmer Signature"
                      style={{ maxWidth: '200px' }}
                    />
                  </div>
                )}
              </Form.Group>
            </Col>

            {/* ─── Surveyor’s Signature ───────────────────────────────────────── */}
            <Col md={6}>
              <Form.Group controlId="finalsurveyorsignatureUrl">
                <Form.Label>Surveyor's Signature</Form.Label>
                <SignatureCanvas
                  ref={surveyorSigPad}
                  canvasProps={{
                    className: 'signature-canvas border',
                    width: 300,
                    height: 100,
                  }}
                />
                <div className="mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handleSignatureSave('finalsurveyorsignatureUrl', surveyorSigPad)
                    }
                  >
                    Save Surveyor's Signature
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="ms-2"
                    onClick={() =>
                      clearSignature('finalsurveyorsignatureUrl', surveyorSigPad)
                    }
                  >
                    Clear
                  </Button>
                </div>
                {formData.finalsurveyorsignatureUrl && (
                  <div className="mt-2">
                    <strong>Surveyor's Signature:</strong>
                    <img
                      src={resolveAssetUrl(formData.finalsurveyorsignatureUrl)}
                      alt="Surveyor Signature"
                      style={{ maxWidth: '200px' }}
                    />
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Confirm Receipt
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
