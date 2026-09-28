/* components/DuplicateDecisionModal.jsx */
import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table } from 'react-bootstrap';

const DuplicateDecisionModal = ({
  show,
  duplicates = [],
  initialDecisions = {},
  onConfirm,
  onHide
}) => {
  const [decisions, setDecisions] = useState(initialDecisions);

  /* keep local state in‑sync when parent updates it */
  useEffect(() => setDecisions(initialDecisions), [initialDecisions]);

  const handleDecisionChange = (id, value) =>
    setDecisions(prev => ({ ...prev, [id]: value }));

  const bulkApply = value => {
    const obj = {};
    duplicates.forEach(d => { obj[d.beneficiaryId] = value; });
    setDecisions(obj);
  };

  const submit = () => onConfirm(decisions);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Duplicate Records Detected</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <p>Choose <strong>Skip</strong> to ignore or <strong>Update</strong> to overwrite the existing record.</p>

        <Table responsive bordered hover size="sm">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Beneficiary&nbsp;ID</th>
              <th>Name</th>
              <th>Aadhar</th>
              <th>Mobile</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {duplicates.map((d, idx) => (
              <tr key={d.beneficiaryId}>
                <td>{idx + 1}</td>
                <td>{d.beneficiaryId}</td>
                <td>{d.beneficiaryName}</td>
                <td>{d.aadharNo}</td>
                <td>{d.mobile}</td>
                <td>
                  <Form.Check
                    inline
                    type="radio"
                    id={`skip-${d.beneficiaryId}`}
                    name={d.beneficiaryId}
                    label="Skip"
                    value="skip"
                    checked={decisions[d.beneficiaryId] === 'skip'}
                    onChange={e => handleDecisionChange(d.beneficiaryId, e.target.value)}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    id={`upd-${d.beneficiaryId}`}
                    name={d.beneficiaryId}
                    label="Update"
                    value="update"
                    checked={decisions[d.beneficiaryId] === 'update'}
                    onChange={e => handleDecisionChange(d.beneficiaryId, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => bulkApply('skip')}>
            Skip&nbsp;All
          </Button>
          <Button variant="outline-secondary" onClick={() => bulkApply('update')}>
            Update&nbsp;All
          </Button>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="success" onClick={submit}>
          Confirm&nbsp;Choices
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DuplicateDecisionModal;
