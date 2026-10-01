import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../config';

const TYPE_META = {
  SURVEY: { label: 'Survey / field verification', field: 'surveyorName' },
  INSTALLATION: { label: 'Installation', field: 'installationAssignedTechnician' },
  REWORK: { label: 'Complaint / rework', field: 'reworkAssignTechnician' },
};

export default function AgencyTechnicianAssignmentModal({ show, farmer, technicians = [], role = 'admin', onClose, onDone }) {
  const [assignmentType, setAssignmentType] = useState('SURVEY');
  const [technicianId, setTechnicianId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  useEffect(() => {
    if (!show) return;
    setAssignmentType('SURVEY'); setTechnicianId(''); setReason(''); setError('');
  }, [show, farmer?._id]);

  const current = TYPE_META[assignmentType] ? farmer?.[TYPE_META[assignmentType].field] : '';
  const submit = async (event) => {
    event.preventDefault();
    if (!farmer?._id || !technicianId || reason.trim().length < 3) return;
    setSaving(true); setError('');
    try {
      const { data } = await axios.post(`${API_URL}/api/farmers/${farmer._id}/assign-technician`, { assignmentType, technicianId, reason: reason.trim() }, auth);
      onDone?.(data);
    } catch (e) { setError(e.response?.data?.message || 'Unable to assign technician.'); }
    finally { setSaving(false); }
  };

  return <Modal show={show} onHide={() => !saving && onClose?.()} centered size="lg"><Form onSubmit={submit}>
    <Modal.Header closeButton={!saving}><div><small className="agency-modal-kicker">WORK ASSIGNMENT</small><Modal.Title>Assign technician</Modal.Title><p>{farmer?.beneficiaryName || 'Beneficiary'} · {farmer?.beneficiaryId || '—'}</p></div></Modal.Header>
    <Modal.Body>
      {error && <div className="agency-inline-error">{error}</div>}
      <div className="assignment-context-grid">
        <div><span>Survey / verification</span><strong>{farmer?.surveyorName || 'Not assigned'}</strong></div>
        <div><span>Installation</span><strong>{farmer?.installationAssignedTechnician || 'Not assigned'}</strong></div>
        <div><span>Complaint / rework</span><strong>{farmer?.reworkAssignTechnician || 'Not assigned'}</strong></div>
      </div>
      <div className="agency-form-grid mt-3">
        <Form.Group><Form.Label>Work type</Form.Label><Form.Select value={assignmentType} onChange={(e) => { setAssignmentType(e.target.value); setTechnicianId(''); }}><option value="SURVEY">Survey / field verification</option><option value="INSTALLATION">Installation</option><option value="REWORK">Complaint / rework</option></Form.Select></Form.Group>
        <Form.Group><Form.Label>Technician</Form.Label><Form.Select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} required><option value="">Select active technician</option>{technicians.map((tech) => <option key={tech._id} value={tech._id}>{tech.username} · {tech.mobile}</option>)}</Form.Select></Form.Group>
        <Form.Group className="agency-form-grid__full"><Form.Label>Assignment reason</Form.Label><Form.Control as="textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this work being assigned or reassigned?" required /><Form.Text>{role === 'superadmin' ? 'This assignment is applied immediately and audited.' : 'Agency Admin assignments are submitted for Superadmin approval and remain auditable.'}</Form.Text></Form.Group>
      </div>
      {current && <div className="agency-assignment-note">Current {TYPE_META[assignmentType].label.toLowerCase()} owner: <strong>{current}</strong></div>}
    </Modal.Body>
    <Modal.Footer><Button variant="outline-secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving || !technicianId || reason.trim().length < 3}>{saving ? 'Saving…' : role === 'superadmin' ? 'Assign technician' : 'Submit assignment request'}</Button></Modal.Footer>
  </Form></Modal>;
}
