import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
  Card,
  Toast,
  Accordion,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import { FaEraser, FaSignature, FaCloud, FaWifi } from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import './FieldVerification.css';
import { API_URL, resolveAssetUrl } from '../config';
import { deleteFieldDraft, getFieldDraft, saveFieldDraft } from '../offlineStore';
import { formatBytes, optimiseImageFile, optimiseImageFiles, totalFileBytes } from '../utils/imageFiles';


// Helper: Convert signature data-URL to File
function dataURLtoFile(dataurl, filename) {
  try {
    const [hdr, b64] = dataurl.split(',');
    const mime = hdr.match(/:(.*?);/)[1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], filename, { type: mime });
  } catch (err) {
    console.error('Error converting dataURL to File:', err);
    return null;
  }
}

export default function FieldVerification({ farmerId, onVerificationComplete }) {
  const [loading, setLoading] = useState(true);
  const [farmer, setFarmer] = useState(null);
  const [error, setError] = useState('');
  const [geoError, setGeoError] = useState('');
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Form fields
  const [siteDepth, setSiteDepth] = useState('');
  const [status, setStatus] = useState('Pending');
  const [landHoldingAcre, setLandHoldingAcre] = useState('');
  const [landOwnershipType, setLandOwnershipType] = useState('');
  const [actualHeadM, setActualHeadM] = useState('');
  const [sourceDepthFeet, setSourceDepthFeet] = useState('');
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().slice(0, 10));

  // Files & signature
  const [farmerPhoto, setFarmerPhoto] = useState(null);
  const [sitePhotos, setSitePhotos] = useState([]);
  const [signatureData, setSignatureData] = useState('');
  const sigCanvas = useRef();

  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [submitting, setSubmitting] = useState(false);
  const [optimisingPhotos, setOptimisingPhotos] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const skipNextDraftSave = useRef(false);
  const token = localStorage.getItem('token');
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const draftKey = farmerId ? `field-verification:${farmerId}` : '';

  // Load farmer data and prefill form
  useEffect(() => {
    if (!farmerId) {
      setError('Invalid farmer ID');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/farmers/${farmerId}`, auth);
        setFarmer(data);
        const [serverLat, serverLng] = (data.siteLocation || '').split(',');
        const draft = await getFieldDraft(`field-verification:${farmerId}`);
        const saved = draft?.data || {};
        setSiteDepth(saved.siteDepth ?? data.siteDepth ?? '');
        setStatus(saved.status ?? data.inspectionStatus ?? 'Pending');
        setLandHoldingAcre(saved.landHoldingAcre ?? data.landHoldingAcre ?? '');
        setLandOwnershipType(saved.landOwnershipType ?? data.landOwnershipType ?? '');
        setActualHeadM(saved.actualHeadM ?? data.actualHeadM ?? '');
        setSourceDepthFeet(saved.sourceDepthFeet ?? data.sourceDepthFeet ?? '');
        setSurveyDate(saved.surveyDate ?? data.surveyDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
        setLocation(saved.location || { lat: serverLat || '', lng: serverLng || '' });
        setFarmerPhoto(saved.farmerPhoto || null);
        setSitePhotos(Array.isArray(saved.sitePhotos) ? saved.sitePhotos : []);
        setSignatureData(saved.signatureData || '');
        if (draft?.updatedAt) setDraftSavedAt(draft.updatedAt);
        setDraftReady(true);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Farmer not found.' : 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [farmerId]);

  useEffect(() => {
    if (!draftReady || !farmer || !draftKey) return undefined;
    if (skipNextDraftSave.current) { skipNextDraftSave.current = false; return undefined; }
    const timer = setTimeout(async () => {
      await saveFieldDraft(draftKey, {
        siteDepth, status, landHoldingAcre, landOwnershipType, actualHeadM, sourceDepthFeet, surveyDate,
        location, farmerPhoto, sitePhotos, signatureData, beneficiaryId: farmer.beneficiaryId, beneficiaryName: farmer.beneficiaryName
      });
      setDraftSavedAt(Date.now());
    }, 450);
    return () => clearTimeout(timer);
  }, [draftReady, farmer, draftKey, siteDepth, status, landHoldingAcre, landOwnershipType, actualHeadM, sourceDepthFeet, surveyDate, location, farmerPhoto, sitePhotos, signatureData]);

  useEffect(() => {
    if (!signatureData || !sigCanvas.current) return;
    try { sigCanvas.current.fromDataURL(signatureData); } catch {}
  }, [signatureData, farmer]);

  // Geolocation
  const fetchLocation = () => {
    if (isFetchingLocation) return;
    setGeoError('');
    setIsFetchingLocation(true);
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported. Please enter location manually.');
      setIsFetchingLocation(false);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const newLocation = {
          lat: coords.latitude.toString(),
          lng: coords.longitude.toString(),
        };
        setLocation(newLocation);
        setToast({ show: true, message: 'Location fetched successfully', variant: 'success' });
        navigator.geolocation.clearWatch(id);
        setWatchId(null);
        setIsFetchingLocation(false);
      },
      (err) => {
        let errorMessage = '';
        switch (err.code) {
          case 1:
            errorMessage = 'Location access denied. Please enable location in browser settings.';
            break;
          case 2:
            errorMessage = 'Location unavailable. Please enter location manually.';
            break;
          case 3:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred. Please try again.';
        }
        setGeoError(errorMessage);
        navigator.geolocation.clearWatch(id);
        setWatchId(null);
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
    );
    setWatchId(id);
  };

  const stopFetching = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsFetchingLocation(false);
      setGeoError('Location fetching cancelled.');
    }
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    };
  }, [watchId]);

  // Signature controls
  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setSignatureData('');
    }
  };

  const captureSignature = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      setSignatureData(dataUrl);
      setToast({ show: true, message: 'Signature captured successfully', variant: 'success' });
    } else {
      setToast({ show: true, message: 'Signature canvas not ready', variant: 'warning' });
    }
  };

  // Clear form
  const clearForm = async () => {
    skipNextDraftSave.current = true;
    await deleteFieldDraft(draftKey);
    setDraftSavedAt(null);
    setSiteDepth('');
    setStatus('Pending');
    setLandHoldingAcre('');
    setLandOwnershipType('');
    setActualHeadM('');
    setSourceDepthFeet('');
    setSurveyDate(new Date().toISOString().slice(0, 10));
    setLocation({ lat: '', lng: '' });
    setFarmerPhoto(null);
    setSitePhotos([]);
    clearSignature();
  };

  const handleFarmerPhoto = async (file) => {
    if (!file) return;
    setOptimisingPhotos(true);
    try {
      const optimised = await optimiseImageFile(file, { maxBytes: 300 * 1024, maxDimension: 1440 });
      setFarmerPhoto(optimised);
      setToast({ show: true, message: `Farmer photo ready (${formatBytes(optimised.size)}).`, variant: 'success' });
    } finally { setOptimisingPhotos(false); }
  };

  const handleSitePhotos = async (files) => {
    const picked = Array.from(files || []).slice(0, 10);
    if (!picked.length) return;
    setOptimisingPhotos(true);
    try {
      const optimised = await optimiseImageFiles(picked, { maxBytes: 260 * 1024, maxDimension: 1440 });
      setSitePhotos(optimised);
      setToast({ show: true, message: `${optimised.length} survey photo${optimised.length === 1 ? '' : 's'} ready (${formatBytes(totalFileBytes(optimised))}).`, variant: 'success' });
    } finally { setOptimisingPhotos(false); }
  };

  // Validate form fields
  const validateForm = () => {
    const missingFields = [];
    if (!siteDepth) missingFields.push('Site Depth');
    if (!status) missingFields.push('Inspection Status');
    if (!landHoldingAcre) missingFields.push('Land Holding (Acre)');
    if (!landOwnershipType) missingFields.push('Land Ownership Type');
    if (!actualHeadM) missingFields.push('Actual HEAD (m)');
    if (!sourceDepthFeet) missingFields.push('Source Depth (Feet)');
    if (!location.lat || !location.lng) missingFields.push('Location');
    if (!farmerPhoto) missingFields.push('Farmer Photo');
    if (sitePhotos.length === 0) missingFields.push('Survey Photos');
    if (!signatureData) missingFields.push('Farmer Signature');
    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  };

  const buildPayload = (photo = farmerPhoto, photos = sitePhotos) => {
    const fd = new FormData();
    fd.append('siteDepth', siteDepth);
    fd.append('status', status);
    fd.append('surveyDate', surveyDate);
    fd.append('landHoldingAcre', landHoldingAcre);
    fd.append('landOwnershipType', landOwnershipType);
    fd.append('actualHeadM', actualHeadM);
    fd.append('sourceDepthFeet', sourceDepthFeet);
    fd.append('lat', location.lat);
    fd.append('lng', location.lng);
    if (photo) fd.append('farmerPhoto', photo);
    photos.forEach((f) => fd.append('sitePhotos', f));
    if (signatureData) {
      const sigFile = dataURLtoFile(signatureData, 'sig.png');
      if (sigFile) fd.append('signature', sigFile);
    }
    return fd;
  };

  const submitPayload = (fd) => axios.post(`${API_URL}/api/field-verification/${farmerId}`, fd, {
    ...auth,
    opsynqDraftKey: draftKey,
  });

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, missingFields } = validateForm();
    if (!isValid) {
      setToast({ show: true, message: `Please fill in the following fields: ${missingFields.join(', ')}`, variant: 'danger' });
      return;
    }
    if (optimisingPhotos || submitting) return;
    if (!dataURLtoFile(signatureData, 'sig.png')) {
      setToast({ show: true, message: 'Invalid signature format', variant: 'danger' });
      return;
    }
    setSubmitting(true);
    try {
      let response;
      try {
        response = await submitPayload(buildPayload());
      } catch (err) {
        if (err.response?.status !== 413) throw err;
        const compactPhoto = await optimiseImageFile(farmerPhoto, { maxBytes: 170 * 1024, maxDimension: 1080 });
        const compactPhotos = await optimiseImageFiles(sitePhotos, { maxBytes: 145 * 1024, maxDimension: 1080 });
        setFarmerPhoto(compactPhoto);
        setSitePhotos(compactPhotos);
        await saveFieldDraft(draftKey, { siteDepth, status, landHoldingAcre, landOwnershipType, actualHeadM, sourceDepthFeet, surveyDate, location, farmerPhoto: compactPhoto, sitePhotos: compactPhotos, signatureData, beneficiaryId: farmer.beneficiaryId, beneficiaryName: farmer.beneficiaryName });
        response = await submitPayload(buildPayload(compactPhoto, compactPhotos));
      }

      if (response?.data?.queued || response?.status === 202) {
        setToast({ show: true, message: 'No internet connection. Your completed verification is saved safely and queued for automatic sync.', variant: 'warning' });
        setTimeout(() => onVerificationComplete?.(), 900);
        return;
      }
      await deleteFieldDraft(draftKey);
      setDraftSavedAt(null);
      setToast({ show: true, message: 'Verification submitted successfully.', variant: 'success' });
      setTimeout(() => {
        setToast((t) => ({ ...t, show: false }));
        onVerificationComplete?.();
      }, 900);
    } catch (err) {
      console.error('Submission error:', err);
      const tooLarge = err.response?.status === 413;
      setToast({
        show: true,
        message: tooLarge ? 'Photos are still too large for this connection. Your draft is safe; remove unnecessary photos or try again.' : `Could not submit now. Your draft is still saved on this device. ${err.response?.data?.message || 'Please retry when the connection is stable.'}`,
        variant: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Modal show centered dialogClassName="fv-modal">
        <Modal.Body className="fv-spinner">
          <Spinner animation="border" /> Loading…
        </Modal.Body>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal show centered dialogClassName="fv-modal">
        <Modal.Header closeButton onHide={onVerificationComplete}>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">{error}</Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onVerificationComplete} disabled={submitting}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (!farmer) {
    return null;
  }

  return (
    <>
      <Toast
        bg={toast.variant}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
        show={toast.show}
        autohide
        delay={5000}
        className="fv-toast"
      >
        <Toast.Body>{toast.message}</Toast.Body>
      </Toast>

      <Modal show onHide={onVerificationComplete} centered dialogClassName="fv-modal" scrollable>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="fv-header">
            <div><Modal.Title>Field Verification</Modal.Title><div className="fv-draft-state"><FaCloud /> {draftSavedAt ? `Draft saved ${new Date(draftSavedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Draft protection active'}</div></div>
          </Modal.Header>
          <Modal.Body className="fv-body">
            <Accordion defaultActiveKey={['0', '1', '2', '3']} alwaysOpen className="fv-accordion">
              {/* Farmer Info & Uploads */}
              <Accordion.Item eventKey="0">
                <Accordion.Header>Farmer Information</Accordion.Header>
                <Accordion.Body>
                  <Row>
                    {[
                      ['Beneficiary ID', 'beneficiaryId'],
                      ['Name', 'beneficiaryName'],
                      ['Mobile', 'mobile'],
                      ['Alt Mobile', 'alternateMobileNumber'],
                      ['Aadhar No', 'aadharNo'],
                      ['Caste', 'casteCategory'],
                      ['Village', 'village'],
                      ['Taluka', 'taluka'],
                      ['District', 'district'],
                      ['Surveyor', 'surveyorName'],
                    ].map(([lbl, key]) => (
                      <Col xs={12} md={6} key={key} className="mb-3">
                        <Form.Group>
                          <Form.Label>{lbl}</Form.Label>
                          <Form.Control
                            readOnly
                            value={farmer[key] || 'N/A'}
                            className="fv-input--readonly"
                          />
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>
                  <Row className="mt-3">
                    {farmer.farmerPhotoUrl && (
                      <Col xs={12} sm={6} md={4} className="mb-3">
                        <Card className="fv-img-card">
                          <Card.Img src={resolveAssetUrl(farmer.farmerPhotoUrl)} alt="Farmer Photo" />
                          <Card.Footer>Farmer Photo</Card.Footer>
                        </Card>
                      </Col>
                    )}
                    {farmer.sitePhotosUrls?.map((u, i) => (
                      <Col xs={12} sm={6} md={4} key={i} className="mb-3">
                        <Card className="fv-img-card">
                          <Card.Img src={resolveAssetUrl(u)} alt={`Survey Photo ${i + 1}`} loading="lazy" />
                          <Card.Footer>Survey Photo {i + 1}</Card.Footer>
                        </Card>
                      </Col>
                    ))}
                    {farmer.signatureUrl && (
                      <Col xs={12} sm={6} md={4} className="mb-3">
                        <Card className="fv-img-card">
                          <Card.Img src={resolveAssetUrl(farmer.signatureUrl)} alt="Farmer Signature" loading="lazy" />
                          <Card.Footer>Farmer Signature</Card.Footer>
                        </Card>
                      </Col>
                    )}
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* Verification Details */}
              <Accordion.Item eventKey="1">
                <Accordion.Header>Verification Details</Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>
                          Site Depth <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={siteDepth}
                          onChange={(e) => setSiteDepth(e.target.value)}
                          required
                          placeholder="Enter site depth"
                        />
                        <Form.Control.Feedback type="invalid">
                          Site Depth is required.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>
                          Survey Status <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          required
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>
                          Land Holding (Acre) <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={landHoldingAcre}
                          onChange={(e) => setLandHoldingAcre(e.target.value)}
                          required
                          placeholder="Enter land holding in acres"
                        />
                        <Form.Control.Feedback type="invalid">
                          Land Holding is required.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>
                          Land Ownership Type <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={landOwnershipType}
                          onChange={(e) => setLandOwnershipType(e.target.value)}
                          required
                          placeholder="Enter ownership type"
                        />
                        <Form.Control.Feedback type="invalid">
                          Land Ownership Type is required.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>
                          Actual HEAD (m) <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={actualHeadM}
                          onChange={(e) => setActualHeadM(e.target.value)}
                          required
                          placeholder="Enter head in meters"
                        />
                        <Form.Control.Feedback type="invalid">
                          Actual HEAD is required.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>
                          Source Depth (Feet) <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          value={sourceDepthFeet}
                          onChange={(e) => setSourceDepthFeet(e.target.value)}
                          required
                          placeholder="Enter source depth in feet"
                        />
                        <Form.Control.Feedback type="invalid">
                          Source Depth is required.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Survey Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={surveyDate}
                          readOnly
                          className="fv-input--readonly"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* Location */}
              <Accordion.Item eventKey="2">
                <Accordion.Header>Location</Accordion.Header>
                <Accordion.Body>
                  <Button
                    onClick={fetchLocation}
                    className="mb-3 fv-btn-primary"
                    aria-label="Fetch Current Location"
                    disabled={isFetchingLocation}
                  >
                    {isFetchingLocation ? 'Fetching Location...' : 'Fetch Current Location'}
                  </Button>
                  {isFetchingLocation && (
                    <Button
                      variant="danger"
                      onClick={stopFetching}
                      className="mb-3 ms-2"
                      aria-label="Stop Fetching Location"
                    >
                      Stop Fetching
                    </Button>
                  )}
                  {isFetchingLocation && (
                    <Alert variant="info" className="mb-3">
                      <Spinner animation="border" size="sm" /> Fetching location... This may take up to 1 minute.
                    </Alert>
                  )}
                  {geoError && <Alert variant="warning" className="mb-3">{geoError}</Alert>}
                  <Row>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Latitude <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          value={location.lat}
                          onChange={(e) => setLocation((l) => ({ ...l, lat: e.target.value }))}
                          placeholder="Enter latitude"
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Latitude is required.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Longitude <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          value={location.lng}
                          onChange={(e) => setLocation((l) => ({ ...l, lng: e.target.value }))}
                          placeholder="Enter longitude"
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Longitude is required.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>

              {/* Photos & Signature */}
              <Accordion.Item eventKey="3">
                <Accordion.Header>Photos & Farmer Signature</Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Farmer Photo <span className="text-danger">*</span></Form.Label>
                        <OverlayTrigger placement="top" overlay={<Tooltip>Upload farmer photo</Tooltip>}>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={(e) => handleFarmerPhoto(e.target.files?.[0])}
                            disabled={optimisingPhotos}
                          />
                        </OverlayTrigger>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Survey Photos <span className="text-danger">*</span></Form.Label>
                        <OverlayTrigger placement="top" overlay={<Tooltip>Upload multiple survey photos</Tooltip>}>
                          <Form.Control
                            type="file"
                            multiple
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleSitePhotos(e.target.files)}
                            disabled={optimisingPhotos}
                          />
                        </OverlayTrigger>
                      </Form.Group>
                    </Col>
                    <Col xs={12} className="fv-upload-summary">
                      <div><strong>Farmer photo</strong><span>{farmerPhoto ? `${farmerPhoto.name} · ${formatBytes(farmerPhoto.size)}` : 'Not selected'}</span></div>
                      <div><strong>Survey photos</strong><span>{sitePhotos.length ? `${sitePhotos.length} file${sitePhotos.length === 1 ? '' : 's'} · ${formatBytes(totalFileBytes(sitePhotos))}` : 'Not selected'}</span></div>
                    </Col>
                    <Col xs={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Farmer Signature <span className="text-danger">*</span></Form.Label>
                        <SignatureCanvas
                          ref={sigCanvas}
                          penColor="black"
                          canvasProps={{
                            className: 'fv-sig-canvas',
                            width: 500,
                            height: 150,
                          }}
                        />
                        <div className="fv-sig-buttons mt-2">
                          <OverlayTrigger placement="top" overlay={<Tooltip>Clear signature</Tooltip>}>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={clearSignature}
                              className="me-2"
                              aria-label="Clear Signature"
                            >
                              <FaEraser /> Clear
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger placement="top" overlay={<Tooltip>Capture signature</Tooltip>}>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={captureSignature}
                              aria-label="Capture Signature"
                            >
                              <FaSignature /> Capture
                            </Button>
                          </OverlayTrigger>
                        </div>
                        {signatureData && (
                          <div className="mt-2">
                            <img src={signatureData} alt="Captured Signature" style={{ border: '1px solid #ccc', maxWidth: '100%' }} />
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Modal.Body>
          <Modal.Footer className="fv-footer"><div className="fv-continuity"><FaWifi /><span>{navigator.onLine ? 'Autosaved on this device' : 'Offline · draft protected'}</span></div>
            <Button variant="outline-secondary" onClick={clearForm} disabled={submitting || optimisingPhotos}>
              Clear Form
            </Button>
            <Button variant="secondary" onClick={onVerificationComplete} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={submitting || optimisingPhotos}>
              {optimisingPhotos ? 'Optimising photos…' : submitting ? 'Submitting…' : navigator.onLine ? 'Submit Verification' : 'Save for Sync'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}