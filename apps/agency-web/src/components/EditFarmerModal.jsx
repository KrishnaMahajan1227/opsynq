// src/components/EditFarmerModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Accordion,
  Image,
} from 'react-bootstrap';
import axios from 'axios';
import './EditFarmerModal.css';

import { API_URL, resolveAssetUrl } from '../config';

// Enumerations exactly matching your Mongoose schema
const SCHEMES = [
  'MSEDCL Atal Solar Krushi Pump Yojana',
  'MEDA Atal Phase 1',
  'MEDA Atal Phase 2',
  'MSEDCL MSKPY T 1',
  'MSEDCL MSKPY T 2',
  'MSEDCL MSKPY T 3',
  'MSEDCL MSKPY T 4',
  'MEDA PM KUSUM Phase 1',
  'MEDA PM KUSUM Phase 2',
  'MEDA PM KUSUM Phase 3',
  'MEDA PM KUSUM Phase 4',
  'MEDA PM KUSUM Phase 5',
  'MSEDCL PM KUSUM T 1',
  'MSEDCL PM KUSUM T 2',
  'MSEDCL MTSKPY T1',
  'MEDA MTSKPY T1',
  ''
];
const INSPECTION_STATUSES = ['Pending', 'In Progress', 'Completed'];
const APPLICATION_STATUSES = [
  'Pending',
  'Pending Installation',
  'Move to Installation',
  'Ordered',
  'Dispatch Completed',
  'Ready for Installation',
  'Installation Completed',
  'Complaint Raised',
  'Closed'
];
const BOOL_OPTIONS = ['', 'Yes', 'No'];
const MATERIAL_LOCATION = ['', 'On Site', 'Warehouse'];
const COMPLAINT_STATUSES = ['', 'Open', 'In Progress', 'Resolved'];
const ORDER_RECEIVED_YESNO = ['', 'Yes', 'No'];

// Reusable form controls
const Input = ({ lg = 6, label, ...props }) => (
  <Form.Group as={Col} lg={lg} className="mb-3 efm__form-group">
    <Form.Label className="efm__form-label">{label}</Form.Label>
    <Form.Control {...props} className="efm__form-control" />
  </Form.Group>
);

const DateInput = ({ name, label, lg = 6, value, onChange }) => (
  <Input
    lg={lg}
    name={name}
    label={label}
    type="date"
    value={value ? value.toString().substring(0, 10) : ''}
    onChange={onChange}
  />
);

const SelectField = ({
  name,
  label,
  lg = 6,
  options = [],
  value,
  onChange,
  required = false,
}) => (
  <Form.Group as={Col} lg={lg} className="mb-3 efm__form-group">
    <Form.Label className="efm__form-label">{label}</Form.Label>
    <Form.Select
      name={name}
      value={value || ''}
      onChange={onChange}
      required={required}
      className="efm__form-select"
    >
      <option value="">Choose…</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </Form.Select>
  </Form.Group>
);

const SectionWrapper = ({ title, children }) => (
  <fieldset className="efm__section">
    <legend className="efm__section-legend">{title}</legend>
    {children}
  </fieldset>
);

const EditFarmerModal = ({ show, onHide, handleClose, farmer, onUpdate, handleSubmit: parentHandleSubmit, onSave }) => {
  const closeModal = onHide || handleClose || (() => {});
  const notifyUpdated = onUpdate || parentHandleSubmit || onSave || (() => {});
  const role = localStorage.getItem('userRole');
  const [formData, setFormData] = useState({});
  const [surveyors, setSurveyors] = useState([]);
  const [panelsArray, setPanelsArray] = useState(['']);
  const [sitePhotosArray, setSitePhotosArray] = useState(['']);
  const [finalSitePhotosArray, setFinalSitePhotosArray] = useState(['']);
  const [lrPhotoArray, setLrPhotoArray] = useState(['']);
  const modalBodyRef = useRef(null);

  // Prefill when modal opens:
  useEffect(() => {
    if (show && farmer) {
      setFormData({ ...farmer });

      // panels[] → panelsArray
      if (Array.isArray(farmer.panels) && farmer.panels.length > 0) {
        setPanelsArray([...farmer.panels]);
      } else {
        setPanelsArray(['']);
      }

      // sitePhotosUrls → sitePhotosArray
      if (Array.isArray(farmer.sitePhotosUrls) && farmer.sitePhotosUrls.length > 0) {
        setSitePhotosArray([...farmer.sitePhotosUrls]);
      } else {
        setSitePhotosArray(['']);
      }

      // finalsitePhotosUrls → finalSitePhotosArray
      if (
        Array.isArray(farmer.finalsitePhotosUrls) &&
        farmer.finalsitePhotosUrls.length > 0
      ) {
        setFinalSitePhotosArray([...farmer.finalsitePhotosUrls]);
      } else {
        setFinalSitePhotosArray(['']);
      }

      // lrPhotoUrls → lrPhotoArray
      if (Array.isArray(farmer.lrPhotoUrls) && farmer.lrPhotoUrls.length > 0) {
        setLrPhotoArray([...farmer.lrPhotoUrls]);
      } else {
        setLrPhotoArray(['']);
      }
    }
  }, [show, farmer]);

  // Load surveyors if admin/superadmin:
  useEffect(() => {
    if (show && (role === 'admin' || role === 'superadmin')) {
      loadSurveyors();
    }
  }, [show, role]);

  const loadSurveyors = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${API_URL}/api/users`, {
        params: { role: 'field_technician' },
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(resp.data)
        ? resp.data
        : Array.isArray(resp.data.users)
        ? resp.data.users
        : [];
      setSurveyors(list);
    } catch (err) {
      console.error('Failed to fetch surveyors:', err);
    }
  };

  // Preserve scroll position inside modal body:
  useEffect(() => {
    const modalBody = modalBodyRef.current;
    if (!modalBody) return;
    let scrollPos = modalBody.scrollTop;
    const handleScroll = () => {
      scrollPos = modalBody.scrollTop;
    };
    modalBody.addEventListener('scroll', handleScroll);
    modalBody.scrollTop = scrollPos;
    return () => {
      modalBody.removeEventListener('scroll', handleScroll);
    };
  }, [formData, panelsArray, sitePhotosArray, finalSitePhotosArray, lrPhotoArray]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSurveyorChange = (e) => {
    const mobile = e.target.value;
    const sel = surveyors.find((s) => s.mobile === mobile);
    setFormData((prev) => ({
      ...prev,
      surveyorMobile: mobile,
      surveyorName: sel ? sel.username : '',
    }));
  };

  const handleArrayChange = (index, value, setter, arrayState) => {
    const newArr = [...arrayState];
    newArr[index] = value;
    setter(newArr);
  };

  const addArrayField = (setter, arrayState) => {
    setter([...arrayState, '']);
  };

  const removeArrayField = (index, setter, arrayState) => {
    if (arrayState.length === 1) {
      alert('At least one field is required.');
      return;
    }
    const newArr = arrayState.filter((_, i) => i !== index);
    setter(newArr);
  };

  // ================================
  //   Download CSV: Updated Logic
  // ================================
  const downloadCSV = () => {
    if (!formData.beneficiaryId) {
      alert('Beneficiary ID missing—cannot name CSV file.');
      return;
    }

    const keys = Object.keys(formData).sort();
    const headerRow = keys.join(',');
    const valuesRow = keys
      .map((key) => {
        const val = formData[key];
        if (Array.isArray(val)) {
          return `"${val.map((v) => v.toString().replace(/"/g, '""')).join(';')}"`;
        }
        if (val === null || val === undefined) {
          return '""';
        }
        const maybeDate = new Date(val);
        if (!Number.isNaN(maybeDate.getTime()) && val.toString().match(/^\d{4}-\d{2}-\d{2}/)) {
          return `"${maybeDate.toISOString().substring(0, 10)}"`;
        }
        const strVal = val.toString().replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',');

    const csvContent = `${headerRow}\n${valuesRow}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `farmer_${formData.beneficiaryId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      payload.panels = [...panelsArray];
      payload.sitePhotosUrls = [...sitePhotosArray];
      payload.finalsitePhotosUrls = [...finalSitePhotosArray];
      payload.lrPhotoUrls = [...lrPhotoArray];

      // Ensure required enum fields default to ''
      payload.scheme = payload.scheme || '';
      payload.inspectionStatus = payload.inspectionStatus || '';
      payload.applicationStatus = payload.applicationStatus || '';
      payload.materialOnSiteOrWarehouse = payload.materialOnSiteOrWarehouse || '';
      payload.materialReceivedConfirmationYesNo =
        payload.materialReceivedConfirmationYesNo || '';
      payload.billSubmittedToVendorYesNo = payload.billSubmittedToVendorYesNo || '';
      payload.installationDoneYesNo = payload.installationDoneYesNo || '';
      payload.pumpNotOperatingYesNo = payload.pumpNotOperatingYesNo || '';
      payload.ourBillReceived = payload.ourBillReceived || '';
      payload.ourBillPending = payload.ourBillPending || '';
      payload.complaintStatus = payload.complaintStatus || '';
      payload.orderReceivedConfirmationYesNo =
        payload.orderReceivedConfirmationYesNo || '';
      payload.orderReceivedYesNo = payload.orderReceivedYesNo || '';

      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `${API_URL}/api/farmers/${farmer._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await notifyUpdated(data);
      closeModal();
    } catch (err) {
      console.error('Error updating farmer:', err);
      alert('Update failed. Check console for details.');
    }
  };

  return (
    <Modal
      show={show}
      onHide={closeModal}
      size="xl"
      backdrop="static"
      dialogClassName="efm__modal-dialog"
      className="efm"
    >
      <Form onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title>Edit Farmer Record</Modal.Title>
          <div className="ms-auto">
            <Button
              variant="outline-secondary"
              className="me-2 efm__btn"
              onClick={downloadCSV}
            >
              Download CSV
            </Button>
            <Button
              variant="outline-secondary"
              className="efm__btn"
              onClick={() => window.print()}
            >
              Print Form
            </Button>
          </div>
        </Modal.Header>

        <Modal.Body ref={modalBodyRef} className="efm__modal-body">
          <Accordion defaultActiveKey="0" flush>
            {/* 0: Basic Information */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>Basic Information</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={4}
                      label="Beneficiary ID"
                      name="beneficiaryId"
                      value={formData.beneficiaryId || ''}
                      readOnly
                    />
                    <Input
                      lg={8}
                      label="Beneficiary Name"
                      name="beneficiaryName"
                      value={formData.beneficiaryName || ''}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      lg={4}
                      label="Mobile"
                      name="mobile"
                      value={formData.mobile || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Alternate Mobile"
                      name="alternateMobileNumber"
                      value={formData.alternateMobileNumber || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Aadhar Number"
                      name="aadharNo"
                      value={formData.aadharNo || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Caste Category"
                      name="casteCategory"
                      value={formData.casteCategory || ''}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 1: Address */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>Address</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={6}
                      label="Land Address"
                      name="landAddress"
                      value={formData.landAddress || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={6}
                      label="Village"
                      name="village"
                      value={formData.village || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Taluka"
                      name="taluka"
                      value={formData.taluka || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="District"
                      name="district"
                      value={formData.district || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Division Name"
                      name="divisionName"
                      value={formData.divisionName || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Circle Name"
                      name="circleName"
                      value={formData.circleName || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Zone Name"
                      name="zoneName"
                      value={formData.zoneName || ''}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 2: Scheme & Verification */}
            <Accordion.Item eventKey="2">
              <Accordion.Header>Scheme & Verification</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <SelectField
                      lg={6}
                      label="Scheme"
                      name="scheme"
                      options={SCHEMES}
                      value={formData.scheme}
                      onChange={handleChange}
                      required
                    />
                    <DateInput
                      lg={6}
                      label="Survey Date"
                      name="surveyDate"
                      value={formData.surveyDate}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={6}
                      label="Inspection Status"
                      name="inspectionStatus"
                      options={INSPECTION_STATUSES}
                      value={formData.inspectionStatus}
                      onChange={handleChange}
                      required
                    />
                    <SelectField
                      lg={6}
                      label="Application Status"
                      name="applicationStatus"
                      options={APPLICATION_STATUSES}
                      value={formData.applicationStatus}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      lg={6}
                      label="JSR Technician"
                      name="jsrTechnician"
                      value={formData.jsrTechnician || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={6}
                      label="JSR Approval Date"
                      name="jsrApprovalDate"
                      value={formData.jsrApprovalDate}
                      onChange={handleChange}
                    />
                    <Input
                      lg={6}
                      label="Site Location"
                      name="siteLocation"
                      value={formData.siteLocation || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={6}
                      label="Site Depth"
                      name="siteDepth"
                      value={formData.siteDepth || ''}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 3: Pump & Equipment */}
            <Accordion.Item eventKey="3">
              <Accordion.Header>Pump & Equipment</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={4}
                      label="Pump Type"
                      name="pumpType"
                      value={formData.pumpType || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Pump HP"
                      name="pumpHP"
                      value={formData.pumpHP || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Controller (With/Without)"
                      name="controllerTypeWithOrWithout"
                      value={formData.controllerTypeWithOrWithout || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={3}
                      label="Pump No. Unique"
                      name="pumpNoUnique"
                      value={formData.pumpNoUnique || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={3}
                      label="Motor No. Unique"
                      name="motorNoUnique"
                      value={formData.motorNoUnique || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={3}
                      label="Controller No. Unique"
                      name="controllerNoUnique"
                      value={formData.controllerNoUnique || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={3}
                      label="IMEI No. Unique"
                      name="imeiNoUnique"
                      value={formData.imeiNoUnique || ''}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 4: Vendor Assignment */}
            <Accordion.Item eventKey="4">
              <Accordion.Header>Assigned Vendor / Company</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={6}
                      label="Assigned Vendor / Company Name"
                      name="assignedVendorCompanyName"
                      value={formData.assignedVendorCompanyName || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={6}
                      label="Vendor / Company Assignment Date"
                      name="vendorAssignmentDate"
                      value={formData.vendorAssignmentDate}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 5: Surveyor Assignment (admin only) */}
            {(role === 'admin' || role === 'superadmin') && (
              <Accordion.Item eventKey="5">
                <Accordion.Header>Surveyor Assignment</Accordion.Header>
                <Accordion.Body>
                  <SectionWrapper title="">
                    <Row>
                      <Form.Group as={Col} lg={6} className="mb-3 efm__form-group">
                        <Form.Label className="efm__form-label">Surveyor Mobile</Form.Label>
                        <Form.Select
                          name="surveyorMobile"
                          value={formData.surveyorMobile || ''}
                          onChange={handleSurveyorChange}
                          className="efm__form-select"
                        >
                          <option value="">Select Technician…</option>
                          {surveyors.map((s) => (
                            <option key={s._id} value={s.mobile}>
                              {s.username} ({s.mobile})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Input
                        lg={6}
                        label="Surveyor Name"
                        name="surveyorName"
                        value={formData.surveyorName || ''}
                        readOnly
                      />
                    </Row>
                  </SectionWrapper>
                </Accordion.Body>
              </Accordion.Item>
            )}

            {/* 6: Source & Land */}
            <Accordion.Item eventKey="6">
              <Accordion.Header>Source & Land</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={4}
                      label="Source Type"
                      name="sourceType"
                      value={formData.sourceType || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Land Holding (Acre)"
                      name="landHoldingAcre"
                      value={formData.landHoldingAcre || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Land Ownership Type"
                      name="landOwnershipType"
                      value={formData.landOwnershipType || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Actual Head (m)"
                      name="actualHeadM"
                      value={formData.actualHeadM || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Source Depth (Feet)"
                      name="sourceDepthFeet"
                      value={formData.sourceDepthFeet || ''}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={4}
                      label="JSR Deviation"
                      name="jsrDeviationYesNo"
                      options={BOOL_OPTIONS}
                      value={formData.jsrDeviationYesNo}
                      onChange={handleChange}
                    />
                    <Input
                      lg={12}
                      label="Deviation Remarks"
                      name="deviationRemarks"
                      as="textarea"
                      rows={2}
                      value={formData.deviationRemarks || ''}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 7: Warehouse & Dispatch */}
            <Accordion.Item eventKey="7">
              <Accordion.Header>Warehouse & Dispatch</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <SelectField
                      lg={4}
                      label="Material On Site / Warehouse"
                      name="materialOnSiteOrWarehouse"
                      options={MATERIAL_LOCATION}
                      value={formData.materialOnSiteOrWarehouse}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Warehouse Inward Date"
                      name="warehouseInwardDate"
                      value={formData.warehouseInwardDate}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Vehicle No."
                      name="vehicleNo"
                      value={formData.vehicleNo || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Lot No."
                      name="lotNo"
                      value={formData.lotNo || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Full / Partial Set"
                      name="fullSetOrPartialSet"
                      value={formData.fullSetOrPartialSet || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Invoice No."
                      name="invoiceNo"
                      value={formData.invoiceNo || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Waybill No. (Company)"
                      name="waybillNoFromCompany"
                      value={formData.waybillNoFromCompany || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Lot"
                      name="lot"
                      value={formData.lot || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Material Dispatch Date"
                      name="materialDispatchDate"
                      value={formData.materialDispatchDate}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Transporter Name"
                      name="transporterName"
                      value={formData.transporterName || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Transporter Vehicle No."
                      name="transporterVehicleNo"
                      value={formData.transporterVehicleNo || ''}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={4}
                      label="Material Received Confirmation"
                      name="materialReceivedConfirmationYesNo"
                      options={BOOL_OPTIONS}
                      value={formData.materialReceivedConfirmationYesNo}
                      onChange={handleChange}
                    />
                    <Input
                      lg={12}
                      label="Shortage / Damaged Remarks"
                      name="shortageDamagedRemarks"
                      value={formData.shortageDamagedRemarks || ''}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 8: Delivery Details */}
            <Accordion.Item eventKey="8">
              <Accordion.Header>Delivery Details</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <DateInput
                      lg={4}
                      label="Invoice Date"
                      name="deliveryInvoiceDate"
                      value={formData.deliveryInvoiceDate}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Waybill No."
                      name="deliveryWaybillNo"
                      value={formData.deliveryWaybillNo || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Delivery Challan No."
                      name="deliveryChallanNo"
                      value={formData.deliveryChallanNo || ''}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 9: Installation Details */}
            <Accordion.Item eventKey="9">
              <Accordion.Header>Installation Details</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <DateInput
                      lg={4}
                      label="Installation Date"
                      name="installationDate"
                      value={formData.installationDate}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Installation Completion Date"
                      name="installationCompletionDate"
                      value={formData.installationCompletionDate}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Installed By (Technician)"
                      name="installedByTechnicianName"
                      value={formData.installedByTechnicianName || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Commissioning Date"
                      name="commissioningDate"
                      value={formData.commissioningDate}
                      onChange={handleChange}
                    />
                    <Col lg={4} className="mb-3 efm__form-group">
                      <Form.Label className="efm__form-label">Installed Photo</Form.Label>
                      {formData.installedPhotoUpload ? (
                        <div className="efm__img-container">
                          <Image
                            src={resolveAssetUrl(formData.installedPhotoUpload)}
                            className="efm__img-preview"
                            alt="Installed Photo"
                          />
                        </div>
                      ) : (
                        <div className="efm__img-placeholder">No Photo</div>
                      )}
                      <Form.Control
                        type="text"
                        placeholder="Installed Photo URL"
                        name="installedPhotoUpload"
                        value={formData.installedPhotoUpload || ''}
                        onChange={handleChange}
                        className="efm__form-control"
                      />
                    </Col>
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 10: Panel Serial Numbers */}
            <Accordion.Item eventKey="10">
              <Accordion.Header>Panel Serial Numbers</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    {panelsArray.map((panel, idx) => (
                      <React.Fragment key={idx}>
                        <Col md={8} lg={9} className="efm__form-group">
                          <Form.Group controlId={`panel-${idx}`} className="mb-2">
                            <Form.Label className="efm__form-label">
                              Panel {idx + 1}
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={panel}
                              onChange={(e) =>
                                handleArrayChange(
                                  idx,
                                  e.target.value,
                                  setPanelsArray,
                                  panelsArray
                                )
                              }
                              placeholder={`Enter serial number for Panel ${idx + 1}`}
                              className="efm__form-control"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4} lg={3} className="mb-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              removeArrayField(idx, setPanelsArray, panelsArray)
                            }
                            className="efm__btn w-100"
                          >
                            Remove
                          </Button>
                        </Col>
                      </React.Fragment>
                    ))}
                    <Col lg={12}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          addArrayField(setPanelsArray, panelsArray)
                        }
                        className="efm__btn"
                      >
                        Add Another Panel
                      </Button>
                    </Col>
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 11: Billing & Payments */}
            <Accordion.Item eventKey="11">
              <Accordion.Header>Billing & Payments</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <SelectField
                      lg={4}
                      label="Bill Submitted to Vendor?"
                      name="billSubmittedToVendorYesNo"
                      options={BOOL_OPTIONS}
                      value={formData.billSubmittedToVendorYesNo}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Invoice No. (Vendor)"
                      name="invoiceNoOfBillVendor"
                      value={formData.invoiceNoOfBillVendor || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Rate (Vendor)"
                      name="rateVendor"
                      value={formData.rateVendor || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Payment Received Amount"
                      name="paymentReceivedAmount"
                      value={formData.paymentReceivedAmount || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Payment Received Date"
                      name="paymentReceivedDate"
                      value={formData.paymentReceivedDate}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Assigned to CRM/Admin"
                      name="assignedToCRMExecutiveAdmin"
                      value={formData.assignedToCRMExecutiveAdmin || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Partial Dispatch Date"
                      name="materialPartiallyDispatchDate"
                      value={formData.materialPartiallyDispatchDate}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Complete Dispatch Date"
                      name="materialCompletelyDispatchDate"
                      value={formData.materialCompletelyDispatchDate}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={4}
                      label="Installation Done?"
                      name="installationDoneYesNo"
                      options={BOOL_OPTIONS}
                      value={formData.installationDoneYesNo}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={4}
                      label="Pump Not Operating?"
                      name="pumpNotOperatingYesNo"
                      options={BOOL_OPTIONS}
                      value={formData.pumpNotOperatingYesNo}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 12: Complaint Details */}
            <Accordion.Item eventKey="12">
              <Accordion.Header>Complaint Details</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={6}
                      label="Complaint Issue"
                      name="complaintIssue"
                      value={formData.complaintIssue || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={6}
                      label="Complaint Raised Date"
                      name="complaintRaisedDate"
                      value={formData.complaintRaisedDate}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Complaint Number"
                      name="complaintNumber"
                      value={formData.complaintNumber || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Raised By Name"
                      name="complaintRaisedByName"
                      value={formData.complaintRaisedByName || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Raised By ID"
                      name="complaintRaisedById"
                      value={formData.complaintRaisedById || ''}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={4}
                      label="Complaint Status"
                      name="complaintStatus"
                      options={COMPLAINT_STATUSES}
                      value={formData.complaintStatus}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 13: Subcontractor & Rework */}
            <Accordion.Item eventKey="13">
              <Accordion.Header>Subcontractor & Rework</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={4}
                      label="Subcontractor Rate"
                      name="subcontractorRate"
                      value={formData.subcontractorRate || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Subcontractor Bill"
                      name="subcontractorBill"
                      value={formData.subcontractorBill || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Payment Given to Subcontractor"
                      name="paymentGivenToSubcontractor"
                      value={formData.paymentGivenToSubcontractor || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Payment Pending"
                      name="paymentPending"
                      value={formData.paymentPending || ''}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={4}
                      label="Our Bill Received?"
                      name="ourBillReceived"
                      options={BOOL_OPTIONS}
                      value={formData.ourBillReceived}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={4}
                      label="Our Bill Pending?"
                      name="ourBillPending"
                      options={BOOL_OPTIONS}
                      value={formData.ourBillPending}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Rework Work"
                      name="reWork"
                      value={formData.reWork || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Issues"
                      name="issues"
                      value={formData.issues || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Rework Assign Technician"
                      name="reworkAssignTechnician"
                      value={formData.reworkAssignTechnician || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Rework Assign Date"
                      name="reworkAssignDate"
                      value={formData.reworkAssignDate}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Solution Date"
                      name="solutionDate"
                      value={formData.solutionDate}
                      onChange={handleChange}
                    />
                    <Input
                      lg={4}
                      label="Charges To Debit"
                      name="chargesToDebit"
                      value={formData.chargesToDebit || ''}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 14: Upload URLs */}
            <Accordion.Item eventKey="14">
              <Accordion.Header>Upload URLs</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    {/* Farmer Photo Preview & URL */}
                    <Col lg={6} className="mb-3 efm__form-group">
                      <Form.Label className="efm__form-label">Farmer Photo</Form.Label>
                      <div className="efm__img-container">
                        {formData.farmerPhotoUrl ? (
                          <Image
                            src={resolveAssetUrl(formData.farmerPhotoUrl)}
                            className="efm__img-preview"
                            alt="Farmer"
                          />
                        ) : (
                          <div className="efm__img-placeholder">No Photo</div>
                        )}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="Farmer Photo URL"
                        name="farmerPhotoUrl"
                        value={formData.farmerPhotoUrl || ''}
                        onChange={handleChange}
                        className="efm__form-control"
                      />
                    </Col>

                    {/* Signature */}
                    <Col lg={6} className="mb-3 efm__form-group">
                      <Form.Label className="efm__form-label">Signature</Form.Label>
                      <div className="efm__img-container">
                        {formData.signatureUrl ? (
                          <Image
                            src={resolveAssetUrl(formData.signatureUrl)}
                            className="efm__img-preview"
                            alt="Signature"
                          />
                        ) : (
                          <div className="efm__img-placeholder">No Signature</div>
                        )}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="Signature URL"
                        name="signatureUrl"
                        value={formData.signatureUrl || ''}
                        onChange={handleChange}
                        className="efm__form-control"
                      />
                    </Col>

                    {/* Site Photos Array */}
                    <Col lg={12} className="mb-4">
                      <h6 className="efm__subheading">Site Photos</h6>
                      {sitePhotosArray.map((url, idx) => (
                        <Row key={idx} className="mb-3 align-items-center">
                          <Col md={4} lg={3} className="efm__form-group">
                            <div className="efm__img-container">
                              {url ? (
                                <Image
                                  src={resolveAssetUrl(url)}
                                  className="efm__img-preview"
                                  alt={`Site Photo ${idx + 1}`}
                                />
                              ) : (
                                <div className="efm__img-placeholder">No Photo</div>
                              )}
                            </div>
                          </Col>
                          <Col md={6} lg={7} className="efm__form-group">
                            <Form.Group controlId={`sitePhoto-${idx}`} className="mb-0">
                              <Form.Label className="efm__form-label">
                                Site Photo URL {idx + 1}
                              </Form.Label>
                              <Form.Control
                                type="text"
                                value={url}
                                onChange={(e) =>
                                  handleArrayChange(
                                    idx,
                                    e.target.value,
                                    setSitePhotosArray,
                                    sitePhotosArray
                                  )
                                }
                                placeholder={`Enter Site Photo URL ${idx + 1}`}
                                className="efm__form-control"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={2} lg={2}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                removeArrayField(
                                  idx,
                                  setSitePhotosArray,
                                  sitePhotosArray
                                )
                              }
                              className="efm__btn w-100"
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      ))}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          addArrayField(setSitePhotosArray, sitePhotosArray)
                        }
                        className="efm__btn"
                      >
                        Add Another Site Photo
                      </Button>
                    </Col>
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 15: Final Upload URLs */}
            <Accordion.Item eventKey="15">
              <Accordion.Header>Final Upload URLs</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    {/* Final Farmer Photo */}
                    <Col lg={6} className="mb-3 efm__form-group">
                      <Form.Label className="efm__form-label">Final Farmer Photo</Form.Label>
                      <div className="efm__img-container">
                        {formData.finalfarmerPhotoUrl ? (
                          <Image
                            src={resolveAssetUrl(formData.finalfarmerPhotoUrl)}
                            className="efm__img-preview"
                            alt="Final Farmer"
                          />
                        ) : (
                          <div className="efm__img-placeholder">No Photo</div>
                        )}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="Final Farmer Photo URL"
                        name="finalfarmerPhotoUrl"
                        value={formData.finalfarmerPhotoUrl || ''}
                        onChange={handleChange}
                        className="efm__form-control"
                      />
                    </Col>

                    {/* Final Surveyor Signature */}
                    <Col lg={6} className="mb-3 efm__form-group">
                      <Form.Label className="efm__form-label">Final Surveyor Signature</Form.Label>
                      <div className="efm__img-container">
                        {formData.finalsurveyorsignatureUrl ? (
                          <Image
                            src={resolveAssetUrl(formData.finalsurveyorsignatureUrl)}
                            className="efm__img-preview"
                            alt="Final Surveyor Signature"
                          />
                        ) : (
                          <div className="efm__img-placeholder">No Signature</div>
                        )}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder="Final Surveyor Signature URL"
                        name="finalsurveyorsignatureUrl"
                        value={formData.finalsurveyorsignatureUrl || ''}
                        onChange={handleChange}
                        className="efm__form-control"
                      />
                    </Col>

                    {/* Final Site Photos Array */}
                    <Col lg={12} className="mb-4">
                      <h6 className="efm__subheading">Final Site Photos</h6>
                      {finalSitePhotosArray.map((url, idx) => (
                        <Row key={idx} className="mb-3 align-items-center">
                          <Col md={4} lg={3} className="efm__form-group">
                            <div className="efm__img-container">
                              {url ? (
                                <Image
                                  src={resolveAssetUrl(url)}
                                  className="efm__img-preview"
                                  alt={`Final Site Photo ${idx + 1}`}
                                />
                              ) : (
                                <div className="efm__img-placeholder">No Photo</div>
                              )}
                            </div>
                          </Col>
                          <Col md={6} lg={7} className="efm__form-group">
                            <Form.Group controlId={`finalSitePhoto-${idx}`} className="mb-0">
                              <Form.Label className="efm__form-label">
                                Final Site Photo URL {idx + 1}
                              </Form.Label>
                              <Form.Control
                                type="text"
                                value={url}
                                onChange={(e) =>
                                  handleArrayChange(
                                    idx,
                                    e.target.value,
                                    setFinalSitePhotosArray,
                                    finalSitePhotosArray
                                  )
                                }
                                placeholder={`Enter Final Site Photo URL ${idx + 1}`}
                                className="efm__form-control"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={2} lg={2}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                removeArrayField(
                                  idx,
                                  setFinalSitePhotosArray,
                                  finalSitePhotosArray
                                )
                              }
                              className="efm__btn w-100"
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      ))}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          addArrayField(setFinalSitePhotosArray, finalSitePhotosArray)
                        }
                        className="efm__btn"
                      >
                        Add Another Final Site Photo
                      </Button>
                    </Col>
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 16: Final Signature URL */}
            <Accordion.Item eventKey="16">
              <Accordion.Header>Final Signature URL</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={12}
                      label="Final Signature URL"
                      name="finalsignatureUrl"
                      value={formData.finalsignatureUrl || ''}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 17: Excel Upload */}
            <Accordion.Item eventKey="17">
              <Accordion.Header>Excel Upload</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={6}
                      label="Excel File Name"
                      name="excelFileName"
                      value={formData.excelFileName || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={6}
                      label="Excel Upload Date"
                      name="excelUploadDate"
                      value={formData.excelUploadDate}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 18: Order Confirmation */}
            <Accordion.Item eventKey="18">
              <Accordion.Header>Order Confirmation</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={4}
                      label="Order Received By (Tech)"
                      name="orderReceivedByTechnician"
                      value={formData.orderReceivedByTechnician || ''}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={4}
                      label="Order Received Confirmation?"
                      name="orderReceivedConfirmationYesNo"
                      options={ORDER_RECEIVED_YESNO}
                      value={formData.orderReceivedConfirmationYesNo}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={4}
                      label="Order Received Date"
                      name="orderReceivedDate"
                      value={formData.orderReceivedDate}
                      onChange={handleChange}
                    />
                    <Input
                      lg={6}
                      label="Order Received Remarks"
                      name="orderReceivedRemarks"
                      value={formData.orderReceivedRemarks || ''}
                      onChange={handleChange}
                    />
                    <SelectField
                      lg={6}
                      label="Order Received?"
                      name="orderReceivedYesNo"
                      options={ORDER_RECEIVED_YESNO}
                      value={formData.orderReceivedYesNo}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={6}
                      label="Material Received Date"
                      name="materialReceivedDate"
                      value={formData.materialReceivedDate}
                      onChange={handleChange}
                    />
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>

            {/* 19: Miscellaneous */}
            <Accordion.Item eventKey="19">
              <Accordion.Header>Miscellaneous</Accordion.Header>
              <Accordion.Body>
                <SectionWrapper title="">
                  <Row>
                    <Input
                      lg={12}
                      label="Remarks"
                      name="remarks"
                      as="textarea"
                      rows={2}
                      value={formData.remarks || ''}
                      onChange={handleChange}
                    />
                    <Input
                      lg={6}
                      label="Confirmed By (Username)"
                      name="confirmedBy"
                      value={formData.confirmedBy || ''}
                      onChange={handleChange}
                    />
                    <DateInput
                      lg={6}
                      label="Confirmation Date"
                      name="confirmationDate"
                      value={formData.confirmationDate}
                      onChange={handleChange}
                    />

                    {/* LR Photo URLs */}
                    <Col lg={12} className="mt-3 mb-4">
                      <h6 className="efm__subheading">LR Photo URLs</h6>
                      {lrPhotoArray.map((url, idx) => (
                        <Row key={idx} className="mb-3 align-items-center">
                          <Col md={4} lg={3} className="efm__form-group">
                            <div className="efm__img-container">
                              {url ? (
                                <Image
                                  src={resolveAssetUrl(url)}
                                  className="efm__img-preview"
                                  alt={`LR Photo ${idx + 1}`}
                                />
                              ) : (
                                <div className="efm__img-placeholder">No LR Photo</div>
                              )}
                            </div>
                          </Col>
                          <Col md={6} lg={7} className="efm__form-group">
                            <Form.Group controlId={`lrPhoto-${idx}`} className="mb-0">
                              <Form.Label className="efm__form-label">
                                LR Photo URL {idx + 1}
                              </Form.Label>
                              <Form.Control
                                type="text"
                                value={url}
                                onChange={(e) =>
                                  handleArrayChange(
                                    idx,
                                    e.target.value,
                                    setLrPhotoArray,
                                    lrPhotoArray
                                  )
                                }
                                placeholder={`Enter LR Photo URL ${idx + 1}`}
                                className="efm__form-control"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={2} lg={2}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                removeArrayField(idx, setLrPhotoArray, lrPhotoArray)
                              }
                              className="efm__btn w-100"
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      ))}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => addArrayField(setLrPhotoArray, lrPhotoArray)}
                        className="efm__btn"
                      >
                        Add Another LR Photo
                      </Button>
                    </Col>
                  </Row>
                </SectionWrapper>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Modal.Body>

        <Modal.Footer className="justify-content-end">
          <Button variant="secondary" className="efm__btn" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" className="efm__btn" type="submit">
            Save
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditFarmerModal;
