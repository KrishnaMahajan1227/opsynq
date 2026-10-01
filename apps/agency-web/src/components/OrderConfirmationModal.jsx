// OrderConfirmationModal.jsx
import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';

import { API_URL, resolveAssetUrl } from '../config.js';
import './OrderConfirmationModal.css';


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
  const token = localStorage.getItem('token');
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // Refs for signature pads
  const farmerSigPad = useRef(null);
  const surveyorSigPad = useRef(null);

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
      const blob = await (await fetch(dataUrl)).blob();
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
    const required = [
      'fullSetOrPartialSet',
      'materialDispatchDate',
      'materialReceivedConfirmationYesNo',
      'materialReceivedDate',
      'pumpNoUnique',
      'motorNoUnique',
      'controllerNoUnique',
      'imeiNoUnique',
      'orderReceivedByTechnician',
      'orderReceivedConfirmationYesNo',
      'orderReceivedDate',
      'orderReceivedYesNo',
      'finalsignatureUrl',
      'finalsurveyorsignatureUrl',
    ];
    if (
      required.some((f) => !formData[f]) ||
      formData.panels.some((p) => !p.trim())
    ) {
      setError('All fields, panels, and both signatures are required.');
      return;
    }

    try {
      console.log('Submitting order confirmation → /api/farmers/:id', { farmerId: farmer._id });

      const payload = {
        // ─── These must match your schema exactly ─────────────────────────
        fullSetOrPartialSet: formData.fullSetOrPartialSet,
        materialDispatchDate: new Date(formData.materialDispatchDate).toISOString(),
        materialReceivedConfirmationYesNo: formData.materialReceivedConfirmationYesNo,
        materialReceivedDate: new Date(formData.materialReceivedDate).toISOString(),

        shortageDamagedRemarks: formData.shortageDamagedRemarks,

        pumpNoUnique: formData.pumpNoUnique,
        motorNoUnique: formData.motorNoUnique,
        controllerNoUnique: formData.controllerNoUnique,
        imeiNoUnique: formData.imeiNoUnique,

        panels: formData.panels.filter(Boolean),

        orderReceivedByTechnician: formData.orderReceivedByTechnician,
        orderReceivedConfirmationYesNo: formData.orderReceivedConfirmationYesNo,
        orderReceivedDate: new Date(formData.orderReceivedDate).toISOString(),
        orderReceivedRemarks: formData.orderReceivedRemarks,
        orderReceivedYesNo: formData.orderReceivedYesNo,

        lrPhotoUrls: formData.lrPhotoUrls,
        finalsignatureUrl: formData.finalsignatureUrl,
        finalsurveyorsignatureUrl: formData.finalsurveyorsignatureUrl,

        // Change applicationStatus in one shot
        applicationStatus: 'Dispatch Completed',

        // Who confirmed and when (timestamps)
        confirmedBy: technicianUsername,
        confirmationDate: new Date().toISOString(),
      };

      const resp = await axios.put(
        `${API_URL}/api/farmers/${farmer._id}`,
        payload,
        auth
      );
      console.log('Order confirmation response:', resp.data);
      setError('');
      onOrderConfirmed(resp.data);
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
              <Form.Group controlId="panels">
                <Form.Label>Panels</Form.Label>
                {formData.panels.map((panel, idx) => (
                  <Row key={idx} className="mb-2 align-items-center">
                    <Col xs={9}>
                      <Form.Control
                        type="text"
                        value={panel}
                        onChange={(e) => handlePanelChange(idx, e.target.value)}
                        placeholder={`Panel ${idx + 1} serial number`}
                        required
                      />
                    </Col>
                    <Col xs={3}>
                      {formData.panels.length > 1 && (
                        <Button variant="danger" size="sm" onClick={() => removePanel(idx)}>
                          Remove
                        </Button>
                      )}
                    </Col>
                  </Row>
                ))}
                <Button variant="secondary" size="sm" onClick={addPanel} className="mt-2">
                  Add Panel
                </Button>
              </Form.Group>
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
                  <div className="mt-2">
                    <strong>Uploaded LR Photos:</strong>
                    <ul>
                      {formData.lrPhotoUrls.map((url, idx) => (
                        <li key={idx}>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            Photo {idx + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
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
