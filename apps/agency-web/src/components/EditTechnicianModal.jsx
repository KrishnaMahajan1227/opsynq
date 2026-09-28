// src/components/EditTechnicianModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';

import { API_URL } from '../config.js';


const EditTechnicianModal = ({ show, handleClose, farmer, onUpdate }) => {
  const [formData, setFormData] = useState({});

  // Prepopulate form data when the modal opens
  useEffect(() => {
    if (farmer) {
      setFormData(farmer);
    }
  }, [farmer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API_URL}/api/farmers/${farmer._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdate(res.data);
      handleClose();
    } catch (error) {
      console.error('Error updating farmer:', error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Field Verification (Edit Technician)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="formSurveyDateTech">
            <Form.Label>Survey Date</Form.Label>
            <Form.Control
              type="date"
              name="surveyDate"
              value={formData.surveyDate ? formData.surveyDate.substring(0,10) : ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formCircleOfficeStatusTech">
            <Form.Label>Circle Office Status</Form.Label>
            <Form.Control
              type="text"
              name="circleOfficeStatus"
              value={formData.circleOfficeStatus || ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formJSRApprovalDateTech">
            <Form.Label>JSR Approval Date</Form.Label>
            <Form.Control
              type="date"
              name="jsrApprovalDate"
              value={formData.jsrApprovalDate ? formData.jsrApprovalDate.substring(0,10) : ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formApplicationStatusTech">
            <Form.Label>Application Status</Form.Label>
            <Form.Control
              type="text"
              name="applicationStatus"
              value={formData.applicationStatus || ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formDivisionNameTech">
            <Form.Label>Division Name</Form.Label>
            <Form.Control
              type="text"
              name="divisionName"
              value={formData.divisionName || ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formStageStatusTech">
            <Form.Label>Stage Status</Form.Label>
            <Form.Control
              type="text"
              name="stageStatus"
              value={formData.stageStatus || ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formInstallationDateTech">
            <Form.Label>Installation Date</Form.Label>
            <Form.Control
              type="date"
              name="installationDate"
              value={formData.installationDate ? formData.installationDate.substring(0,10) : ''}
              onChange={handleChange}
              required
            />
          </Form.Group>
          {/* Additional technician-specific fields */}
          <Form.Group className="mb-3" controlId="formSiteDepth">
            <Form.Label>Site Depth</Form.Label>
            <Form.Control
              type="text"
              name="siteDepth"
              value={formData.siteDepth || ''}
              onChange={handleChange}
              placeholder="Enter site depth"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formSiteLocation">
            <Form.Label>Site Location (Lat, Long)</Form.Label>
            <Form.Control
              type="text"
              name="siteLocation"
              value={formData.siteLocation || ''}
              onChange={handleChange}
              placeholder="Enter site location"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formFarmerPhoto">
            <Form.Label>Farmer Photo URL</Form.Label>
            <Form.Control
              type="text"
              name="farmerPhoto"
              value={formData.farmerPhoto || ''}
              onChange={handleChange}
              placeholder="Enter farmer photo URL"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formSitePhotos">
            <Form.Label>Site Photos URLs (comma separated)</Form.Label>
            <Form.Control
              type="text"
              name="sitePhotos"
              value={formData.sitePhotos || ''}
              onChange={handleChange}
              placeholder="Enter site photos URLs"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formFarmerSignature">
            <Form.Label>Farmer Signature URL</Form.Label>
            <Form.Control
              type="text"
              name="farmerSignature"
              value={formData.farmerSignature || ''}
              onChange={handleChange}
              placeholder="Enter farmer signature URL"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Update
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditTechnicianModal;
