import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Toast, Image, Accordion } from 'react-bootstrap';
import axios from 'axios';

import { API_URL, resolveAssetUrl } from '../config.js';


export default function OrderPlacementModal({ show, handleClose, onHide, farmer, onOrderPlaced, onSave }) {
  const closeModal = handleClose || onHide || (() => {});
  const notifyPlaced = onOrderPlaced || onSave || (() => {});
  const printRef = useRef();

  // ─── Order-form state ───────────────────────────────────────────────────
  const [materialOnSiteOrWarehouse, setMaterialOnSiteOrWarehouse] = useState('');
  const [warehouseInwardDate, setWarehouseInwardDate] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [fullSetOrPartialSet, setFullSetOrPartialSet] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [waybillNoFromCompany, setWaybillNoFromCompany] = useState('');
  const [lot, setLot] = useState('');
  const [materialDispatchDate, setMaterialDispatchDate] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [transporterVehicleNo, setTransporterVehicleNo] = useState('');
  const [materialReceivedConfirmationYesNo, setMaterialReceivedConfirmationYesNo] = useState('');
  const [shortageDamagedRemarks, setShortageDamagedRemarks] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [waybillNo, setWaybillNo] = useState('');
  const [deliveryChallanNo, setDeliveryChallanNo] = useState('');

  // ─── Surveyor assignment ────────────────────────────────────────────────
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState({ username: '', mobile: '' });

  // ─── Toast feedback ─────────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, variant: 'success', message: '' });

  // ─── Load technicians once ──────────────────────────────────────────────
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found.');
        }
        const res = await axios.get(`${API_URL}/api/users?role=field_technician`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const techs = Array.isArray(res.data) ? res.data.filter(t => t.username && t.mobile) : [];
        setTechnicians(techs);
        if (techs.length === 0) {
          setToast({ show: true, variant: 'warning', message: 'No surveyors found.' });
        }
      } catch (err) {
        console.error('Error fetching surveyors:', err);
        setToast({ show: true, variant: 'danger', message: 'Failed to load surveyors.' });
      }
    };
    fetchTechnicians();
  }, []);

  // ─── Prefill inspection data & order fields when `farmer` changes ───────
  useEffect(() => {
    if (!farmer) return;

    // Order fields
    setMaterialOnSiteOrWarehouse(farmer.materialOnSiteOrWarehouse || '');
    setWarehouseInwardDate(farmer.warehouseInwardDate ? farmer.warehouseInwardDate.substr(0, 10) : '');
    setVehicleNo(farmer.vehicleNo || '');
    setLotNo(farmer.lotNo || '');
    setFullSetOrPartialSet(farmer.fullSetOrPartialSet || '');
    setInvoiceNo(farmer.invoiceNo || '');
    setWaybillNoFromCompany(farmer.waybillNoFromCompany || '');
    setLot(farmer.lot || '');
    setMaterialDispatchDate(farmer.materialDispatchDate ? farmer.materialDispatchDate.substr(0, 10) : '');
    setTransporterName(farmer.transporterName || '');
    setTransporterVehicleNo(farmer.transporterVehicleNo || '');
    setMaterialReceivedConfirmationYesNo(farmer.materialReceivedConfirmationYesNo || '');
    setShortageDamagedRemarks(farmer.shortageDamagedRemarks || '');
    setInvoiceDate(farmer.invoiceDate ? farmer.invoiceDate.substr(0, 10) : '');
    setWaybillNo(farmer.waybillNo || '');
    setDeliveryChallanNo(farmer.deliveryChallanNo || '');

    // Surveyor
    if (farmer.reworkAssignTechnician || farmer.surveyorName || farmer.surveyorMobile) {
      const matchingTech = technicians.find(
        t => t.username === (farmer.reworkAssignTechnician || farmer.surveyorName),
      );
      setSelectedTechnician({
        username: farmer.reworkAssignTechnician || farmer.surveyorName || '',
        mobile: matchingTech?.mobile || farmer.surveyorMobile || '',
      });
    } else {
      setSelectedTechnician({ username: '', mobile: '' });
    }
  }, [farmer, technicians]);

  // ─── Print / Download handler ───────────────────────────────────────────
  const handlePrint = () => window.print();

  // ─── Submit handler ─────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    const required = [
      materialOnSiteOrWarehouse,
      warehouseInwardDate,
      vehicleNo,
      lotNo,
      fullSetOrPartialSet,
      invoiceNo,
      waybillNoFromCompany,
      lot,
      materialDispatchDate,
      transporterName,
      transporterVehicleNo,
      materialReceivedConfirmationYesNo,
      shortageDamagedRemarks,
      invoiceDate,
      waybillNo,
      deliveryChallanNo,
      selectedTechnician.username,
    ];
    if (required.some(v => !v)) {
      setToast({ show: true, variant: 'danger', message: 'Please fill in all fields, including surveyor.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found.');
      }
      const selectedTech = technicians.find(t => t.username === selectedTechnician.username);
      if (!selectedTech) {
        throw new Error('Selected surveyor not found.');
      }

      const payload = {
        materialOnSiteOrWarehouse,
        warehouseInwardDate,
        vehicleNo,
        lotNo,
        fullSetOrPartialSet,
        invoiceNo,
        waybillNoFromCompany,
        lot,
        materialDispatchDate,
        transporterName,
        transporterVehicleNo,
        materialReceivedConfirmationYesNo,
        shortageDamagedRemarks,
        invoiceDate,
        waybillNo,
        deliveryChallanNo,
        applicationStatus: 'Ordered',
        reworkAssignTechnician: selectedTechnician.username,
        surveyorName: selectedTechnician.username,
        surveyorMobile: selectedTech.mobile,
      };

      const res = await axios.put(`${API_URL}/api/farmers/${farmer._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setToast({ show: true, variant: 'success', message: 'Order placed successfully!' });
      setTimeout(() => {
        setToast(t => ({ ...t, show: false }));
        onOrderPlaced(res.data);
        closeModal();
      }, 1200);
    } catch (err) {
      console.error('Error placing order:', err);
      setToast({
        show: true,
        variant: 'danger',
        message: err.response?.data?.message || 'Failed to place order.',
      });
    }
  };

  return (
    <>
      {/* Toast */}
      <Toast
        bg={toast.variant}
        onClose={() => setToast(t => ({ ...t, show: false }))}
        show={toast.show}
        autohide
        delay={3000}
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}
      >
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>

      <Modal show={show} onHide={closeModal} backdrop="static" dialogClassName="modal-xl">
        <Modal.Header closeButton>
          <Modal.Title>Installation & Order for {farmer?.beneficiaryName || 'N/A'}</Modal.Title>
          <Button variant="outline-primary" onClick={handlePrint} className="ms-3">
            📄 Print / Download
          </Button>
        </Modal.Header>

        <Modal.Body ref={printRef}>
          <Accordion defaultActiveKey="1">
            {/* ─── Inspection Data ───────────────────────────────────────────── */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>Inspection Data</Accordion.Header>
              <Accordion.Body>
                <Row>
                  {[
                    ['Beneficiary ID', farmer?.beneficiaryId],
                    ['Aadhar No', farmer?.aadharNo],
                    ['Alternate Mobile', farmer?.alternateMobileNumber],
                    ['Application Status', farmer?.applicationStatus],
                    ['Assigned vendor / company', farmer?.assignedVendorCompanyName],
                    ['Category', farmer?.casteCategory],
                    ['Circle', farmer?.circleName],
                    ['Controller Type', farmer?.controllerTypeWithOrWithout],
                    ['District', farmer?.district],
                    ['Division', farmer?.divisionName],
                    ['Taluka', farmer?.taluka],
                    ['Village', farmer?.village],
                    ['Zone', farmer?.zoneName],
                    ['Land Address', farmer?.landAddress],
                    ['Site Location', farmer?.siteLocation],
                    ['Site Depth', farmer?.siteDepth],
                    ['Pump Type/HP', farmer ? `${farmer.pumpType || '—'} / ${farmer.pumpHP || '—'}` : '—'],
                    ['Actual Head (m)', farmer?.actualHeadM],
                    ['Survey Date', farmer?.surveyDate?.substr(0, 10)],
                    ['Surveyor', farmer ? `${farmer.surveyorName || '—'} (${farmer.surveyorMobile || '—'})` : '—'],
                    ['Inspection Status', farmer?.inspectionStatus],
                    ['Deviation?', farmer?.jsrDeviationYesNo],
                    ['Deviation Remarks', farmer?.deviationRemarks],
                  ].map(([label, value]) => (
                    <Col md={6} key={label} className="mb-2">
                      <strong>{label}:</strong> {value || '—'}
                    </Col>
                  ))}
                </Row>

                {/* Photos */}
                {farmer?.sitePhotosUrls?.length > 0 && (
                  <>
                    <h6 className="mt-3">Site Photos</h6>
                    <div className="d-flex flex-wrap">
                      {farmer.sitePhotosUrls.map((url, i) => (
                        <Image key={i} src={resolveAssetUrl(url)} thumbnail style={{ maxWidth: 120, margin: 4 }} />
                      ))}
                    </div>
                  </>
                )}

                {/* Farmer Photo */}
                {farmer?.farmerPhotoUrl && (
                  <>
                    <h6 className="mt-3">Farmer Photo</h6>
                    <Image src={resolveAssetUrl(farmer.farmerPhotoUrl)} thumbnail style={{ maxWidth: 150 }} />
                  </>
                )}

                {/* Signature */}
                {farmer?.signatureUrl && (
                  <>
                    <h6 className="mt-3">Signature</h6>
                    <Image src={resolveAssetUrl(farmer.signatureUrl)} thumbnail style={{ maxWidth: 200 }} />
                  </>
                )}
              </Accordion.Body>
            </Accordion.Item>

            {/* ─── Order Placement Form ─────────────────────────────────────── */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>Order Placement</Accordion.Header>
              <Accordion.Body>
                <Form onSubmit={handleSubmit}>
                  <Row className="gy-3">
                    {/* Material On Site / Warehouse */}
                    <Col md={6}>
                      <Form.Group controlId="materialOnSiteOrWarehouse">
                        <Form.Label>Material On Site / Warehouse</Form.Label>
                        <Form.Select
                          value={materialOnSiteOrWarehouse}
                          onChange={e => setMaterialOnSiteOrWarehouse(e.target.value)}
                          required
                        >
                          <option value="">Select…</option>
                          <option>On Site</option>
                          <option>Warehouse</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* Warehouse Inward Date */}
                    <Col md={6}>
                      <Form.Group controlId="warehouseInwardDate">
                        <Form.Label>Warehouse Inward Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={warehouseInwardDate}
                          onChange={e => setWarehouseInwardDate(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Vehicle No */}
                    <Col md={6}>
                      <Form.Group controlId="vehicleNo">
                        <Form.Label>Vehicle No</Form.Label>
                        <Form.Control
                          type="text"
                          value={vehicleNo}
                          onChange={e => setVehicleNo(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Lot No */}
                    <Col md={6}>
                      <Form.Group controlId="lotNo">
                        <Form.Label>Lot No</Form.Label>
                        <Form.Control
                          type="text"
                          value={lotNo}
                          onChange={e => setLotNo(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Full / Partial Set */}
                    <Col md={6}>
                      <Form.Group controlId="fullSetOrPartialSet">
                        <Form.Label>Full / Partial Set</Form.Label>
                        <Form.Select
                          value={fullSetOrPartialSet}
                          onChange={e => setFullSetOrPartialSet(e.target.value)}
                          required
                        >
                          <option value="">Select…</option>
                          <option>Full Set</option>
                          <option>Partial Set</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* Invoice No */}
                    <Col md={6}>
                      <Form.Group controlId="invoiceNo">
                        <Form.Label>Invoice No</Form.Label>
                        <Form.Control
                          type="text"
                          value={invoiceNo}
                          onChange={e => setInvoiceNo(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Waybill No (Company) */}
                    <Col md={6}>
                      <Form.Group controlId="waybillNoFromCompany">
                        <Form.Label>Waybill No (Company)</Form.Label>
                        <Form.Control
                          type="text"
                          value={waybillNoFromCompany}
                          onChange={e => setWaybillNoFromCompany(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Lot */}
                    <Col md={6}>
                      <Form.Group controlId="lot">
                        <Form.Label>Lot</Form.Label>
                        <Form.Control
                          type="text"
                          value={lot}
                          onChange={e => setLot(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Dispatch Date */}
                    <Col md={6}>
                      <Form.Group controlId="materialDispatchDate">
                        <Form.Label>Material Dispatch Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={materialDispatchDate}
                          onChange={e => setMaterialDispatchDate(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Transporter Name */}
                    <Col md={6}>
                      <Form.Group controlId="transporterName">
                        <Form.Label>Transporter Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={transporterName}
                          onChange={e => setTransporterName(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Transporter Vehicle No */}
                    <Col md={6}>
                      <Form.Group controlId="transporterVehicleNo">
                        <Form.Label>Transporter Vehicle No</Form.Label>
                        <Form.Control
                          type="text"
                          value={transporterVehicleNo}
                          onChange={e => setTransporterVehicleNo(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Material Received */}
                    <Col md={6}>
                      <Form.Group controlId="materialReceivedConfirmationYesNo">
                        <Form.Label>Material Received? (Yes/No)</Form.Label>
                        <Form.Select
                          value={materialReceivedConfirmationYesNo}
                          onChange={e => setMaterialReceivedConfirmationYesNo(e.target.value)}
                          required
                        >
                          <option value="">Select…</option>
                          <option>Yes</option>
                          <option>No</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* Remarks */}
                    <Col md={6}>
                      <Form.Group controlId="shortageDamagedRemarks">
                        <Form.Label>Shortage / Damaged Remarks</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={shortageDamagedRemarks}
                          onChange={e => setShortageDamagedRemarks(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Invoice Date */}
                    <Col md={6}>
                      <Form.Group controlId="invoiceDate">
                        <Form.Label>Invoice Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={invoiceDate}
                          onChange={e => setInvoiceDate(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Waybill No */}
                    <Col md={6}>
                      <Form.Group controlId="waybillNo">
                        <Form.Label>Waybill No</Form.Label>
                        <Form.Control
                          type="text"
                          value={waybillNo}
                          onChange={e => setWaybillNo(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Delivery Challan No */}
                    <Col md={6}>
                      <Form.Group controlId="deliveryChallanNo">
                        <Form.Label>Delivery Challan No</Form.Label>
                        <Form.Control
                          type="text"
                          value={deliveryChallanNo}
                          onChange={e => setDeliveryChallanNo(e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Assign Surveyor */}
                    <Col md={12}>
                      <Form.Group controlId="assignSurveyor">
                        <Form.Label>Assign Surveyor</Form.Label>
                        <Form.Select
                          value={selectedTechnician.username}
                          onChange={e => {
                            const tech = technicians.find(t => t.username === e.target.value);
                            setSelectedTechnician({
                              username: tech?.username || '',
                              mobile: tech?.mobile || '',
                            });
                          }}
                          required
                        >
                          <option value="">Select surveyor…</option>
                          {technicians.map(t => (
                            <option key={t._id} value={t.username}>
                              {`${t.username} (${t.mobile})`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit}>
            Place Order
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}