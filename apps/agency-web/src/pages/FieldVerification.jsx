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
import { FaEraser, FaSignature } from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import './FieldVerification.css';
import { API_URL } from '../config';


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
  const token = localStorage.getItem('token');
  const auth = { headers: { Authorization: `Bearer ${token}` } };

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
        setSiteDepth(data.siteDepth || '');
        setStatus(data.inspectionStatus || 'Pending');
        setLandHoldingAcre(data.landHoldingAcre || '');
        setLandOwnershipType(data.landOwnershipType || '');
        setActualHeadM(data.actualHeadM || '');
        setSourceDepthFeet(data.sourceDepthFeet || '');
        setSurveyDate(data.surveyDate?.slice(0, 10) || new Date().toISOString().slice(0, 10));
        const [lat, lng] = (data.siteLocation || '').split(',');
        setLocation({ lat: lat || '', lng: lng || '' });
      } catch (err) {
        setError(err.response?.status === 404 ? 'Farmer not found.' : 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [farmerId]);

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
  const clearForm = () => {
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

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, missingFields } = validateForm();
    if (!isValid) {
      setToast({
        show: true,
        message: `Please fill in the following fields: ${missingFields.join(', ')}`,
        variant: 'danger',
      });
      return;
    }
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
    if (farmerPhoto) fd.append('farmerPhoto', farmerPhoto);
    sitePhotos.forEach((f) => fd.append('sitePhotos', f));
    if (signatureData) {
      const sigFile = dataURLtoFile(signatureData, 'sig.png');
      if (sigFile) {
        fd.append('signature', sigFile);
      } else {
        setToast({ show: true, message: 'Invalid signature format', variant: 'danger' });
        return;
      }
    }
    try {
      await axios.post(`${API_URL}/api/field-verification/${farmerId}`, fd, {
        ...auth,
        headers: {
          ...auth.headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      setToast({ show: true, message: 'Verification saved successfully ✔️', variant: 'success' });
      setTimeout(() => {
        setToast((t) => ({ ...t, show: false }));
        onVerificationComplete();
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
      setToast({
        show: true,
        message: `Failed to save verification: ${err.response?.data?.message || 'Server error'} ❌`,
        variant: 'danger',
      });
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
          <Button variant="secondary" onClick={onVerificationComplete}>Close</Button>
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
            <Modal.Title>Field Verification</Modal.Title>
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
                          <Card.Img src={farmer.farmerPhotoUrl} alt="Farmer Photo" />
                          <Card.Footer>Farmer Photo</Card.Footer>
                        </Card>
                      </Col>
                    )}
                    {farmer.sitePhotosUrls?.map((u, i) => (
                      <Col xs={12} sm={6} md={4} key={i} className="mb-3">
                        <Card className="fv-img-card">
                          <Card.Img src={u} alt={`Survey Photo ${i + 1}`} />
                          <Card.Footer>Survey Photo {i + 1}</Card.Footer>
                        </Card>
                      </Col>
                    ))}
                    {farmer.signatureUrl && (
                      <Col xs={12} sm={6} md={4} className="mb-3">
                        <Card className="fv-img-card">
                          <Card.Img src={farmer.signatureUrl} alt="Farmer Signature" />
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
                            onChange={(e) => setFarmerPhoto(e.target.files[0])}
                            required
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
                            onChange={(e) => setSitePhotos(Array.from(e.target.files))}
                            required
                          />
                        </OverlayTrigger>
                      </Form.Group>
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
          <Modal.Footer className="fv-footer">
            <Button variant="outline-secondary" onClick={clearForm}>
              Clear Form
            </Button>
            <Button variant="secondary" onClick={onVerificationComplete}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              Submit Verification
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}