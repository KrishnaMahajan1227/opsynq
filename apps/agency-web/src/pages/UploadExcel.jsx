import React, { useState, useCallback } from 'react';
import { Button, Form, Spinner, Modal, Table } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  FaChartPie,
  FaDatabase,
  FaTools,
  FaCheck,
  FaExclamationTriangle,
  FaUsers,
  FaUserCog,
  FaFileAlt,
  FaUpload,
  FaSignOutAlt,
  FaFileExcel,
  FaCloudUploadAlt,
  FaTimes,
  FaCheckCircle,
  FaInfoCircle,
  FaArrowRight,
  FaShieldAlt,
} from 'react-icons/fa';
import axios from 'axios';
import DuplicateDecisionModal from '../components/DuplicateDecisionModal';
import 'react-toastify/dist/ReactToastify.css';
import './UploadExcel.css';
import { API_URL } from '../config';
import AgencySidebar from '../components/AgencySidebar';

const UploadExcel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('');
  const [file, setFile] = useState(null);
  const [jsrFile, setJsrFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [jsrFileError, setJsrFileError] = useState('');
  const [dupModal, setDupModal] = useState({ show: false, duplicates: [], decisions: {} });
  const [schemaModal, setSchemaModal] = useState({ show: false, columns: [], totalRows: 0 });
  const [customFieldDecision, setCustomFieldDecision] = useState('');
  const [jsrResultModal, setJsrResultModal] = useState({ show: false, updated: 0, failedRecords: [], invalidRecords: [] });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const role = (localStorage.getItem('userRole') || 'admin').toLowerCase();
  const isSuperadmin = role === 'superadmin';
  const dashboardPath = isSuperadmin ? '/dashboard/superadmin' : '/dashboard/admin';
  const username = localStorage.getItem('username') || (isSuperadmin ? 'Superadmin' : 'Admin');

  const navItems = isSuperadmin
    ? [
        ['overview', 'Overview', FaChartPie],
        ['records', 'Farmer Records', FaDatabase],
        ['installation', 'Installation Orders', FaTools],
        ['completed', 'Completed Installs', FaCheck],
        ['complaints', 'Complaints', FaExclamationTriangle],
        ['technician-summary', 'Technician Summary', FaUsers],
        ['users', 'User Management', FaUserCog],
        ['requests', 'Admin Requests', FaFileAlt],
      ]
    : [
        ['overview', 'Overview', FaChartPie],
        ['records', 'Farmer Records', FaDatabase],
        ['installation', 'Installation Orders', FaTools],
        ['completed', 'Completed Installs', FaCheck],
        ['complaints', 'Complaints', FaExclamationTriangle],
        ['technician-summary', 'Technician Summary', FaUsers],
      ];

  const reset = useCallback((type = 'regular') => {
    if (type === 'regular') {
      setFile(null);
      setFileError('');
      setCustomFieldDecision('');
      setSchemaModal({ show: false, columns: [], totalRows: 0 });
    } else {
      setJsrFile(null);
      setJsrFileError('');
    }
  }, []);

  const validateFile = (selectedFile, type = 'regular') => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const maxSize = 10 * 1024 * 1024;
    const extValid = selectedFile && /\.(xlsx|xls)$/i.test(selectedFile.name || '');
    if (!selectedFile) {
      const err = 'Please select an Excel file.';
      type === 'regular' ? setFileError(err) : setJsrFileError(err);
      return false;
    }
    if (!allowedTypes.includes(selectedFile.type) && !extValid) {
      const err = 'Only .xlsx or .xls files are allowed.';
      type === 'regular' ? setFileError(err) : setJsrFileError(err);
      return false;
    }
    if (selectedFile.size > maxSize) {
      const err = 'File size must be less than 10 MB.';
      type === 'regular' ? setFileError(err) : setJsrFileError(err);
      return false;
    }
    type === 'regular' ? setFileError('') : setJsrFileError('');
    return true;
  };

  const callApi = useCallback(async (formData, endpoint) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    return axios.post(`${API_URL}/api/farmers/${endpoint}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }, []);

  const downloadTemplate = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/farmers/template/${type === 'jsr' ? 'jsr' : 'beneficiary'}`, { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } });
      const url = URL.createObjectURL(response.data); const a = document.createElement('a'); a.href = url; a.download = `opsynq-agency-${type === 'jsr' ? 'jsr' : 'beneficiary'}-template.xlsx`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) { toast.error(err.response?.data?.message || 'Template download failed.'); }
  };

  const onRegularDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (f && validateFile(f, 'regular')) setFile(f);
  }, []);

  const onJsrDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (f && validateFile(f, 'jsr')) setJsrFile(f);
  }, []);

  const regularDropzone = useDropzone({
    onDrop: onRegularDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const jsrDropzone = useDropzone({
    onDrop: onJsrDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const processRegularUpload = async ({ customDecision = customFieldDecision, duplicateDecisions = null } = {}) => {
    if (!validateFile(file, 'regular')) return;
    setLoading(true);
    setLoadingType('regular');
    try {
      const formData = new FormData();
      formData.append('excel', file);
      if (customDecision) formData.append('customFieldDecision', customDecision);
      if (duplicateDecisions) formData.append('decisions', JSON.stringify(duplicateDecisions));
      const { data } = await callApi(formData, 'uploadExcel');
      if (data.status === 'customFieldsReview') {
        setSchemaModal({ show: true, columns: data.customColumns || [], totalRows: data.totalRows || 0 });
        return;
      }
      if (data.status === 'duplicatesFound') {
        const decisions = Object.fromEntries(data.duplicates.map((d) => [d.beneficiaryId, 'skip']));
        setDupModal({ show: true, duplicates: data.duplicates, decisions });
        toast.info('Duplicate records found. Review them before continuing.');
        return;
      }
      const importSummary = `${data.inserted || 0} created · ${data.updated || 0} updated · ${data.skipped || 0} skipped · ${data.failed || 0} failed`;
      (data.skipped || data.failed ? toast.warn : toast.success)(`Beneficiary import complete: ${importSummary}${data.extraColumnsPreserved ? ' · extra columns preserved' : ''}.`);
      reset('regular');
    } catch (err) {
      const detail = err.response?.data;
      toast.error(detail?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const handleRegularUpload = async (e) => {
    e.preventDefault();
    await processRegularUpload({ customDecision: '' });
  };

  const confirmSchemaDecision = async (decision) => {
    setCustomFieldDecision(decision);
    setSchemaModal((prev) => ({ ...prev, show: false }));
    await processRegularUpload({ customDecision: decision });
  };

  const confirmDuplicates = async (decisions) => {
    setDupModal((prev) => ({ ...prev, show: false }));
    await processRegularUpload({ customDecision: customFieldDecision || 'include', duplicateDecisions: decisions });
  };

  const handleJsrUpload = async (e) => {
    e.preventDefault();
    if (!validateFile(jsrFile, 'jsr')) return;
    setLoading(true);
    setLoadingType('jsr');
    try {
      const formData = new FormData();
      formData.append('excel', jsrFile);
      const { data } = await callApi(formData, 'uploadJsrExcel');
      const jsrAttention = Number(data.failed || 0) + Number(data.invalidRecords?.length || 0);
      (jsrAttention ? toast.warn : toast.success)(`JSR import complete: ${data.updated || 0} updated · ${data.skipped || 0} duplicate row(s) skipped · ${jsrAttention} need attention.`);
      if (data.failedRecords.length || data.invalidRecords.length) {
        setJsrResultModal({
          show: true,
          updated: data.updated,
          failedRecords: data.failedRecords,
          invalidRecords: data.invalidRecords,
        });
      } else {
        reset('jsr');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'JSR upload failed.');
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    const platformBase=import.meta.env.VITE_PLATFORM_APP_URL||(import.meta.env.PROD?window.location.origin:`${window.location.protocol}//${window.location.hostname||'localhost'}:5173`); window.location.assign(`${platformBase}/?login=1`);
  };

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const UploadPanel = ({ type, title, description, fileValue, error, dropzone, onSubmit, onClear, buttonLabel }) => {
    const isCurrentLoading = loading && loadingType === type;
    return (
      <section className="upload-workflow-card">
        <div className="upload-workflow-head">
          <div className="upload-workflow-icon"><FaFileExcel /></div>
          <div>
            <div className="upload-eyebrow">{type === 'regular' ? 'PRIMARY IMPORT' : 'TARGETED UPDATE'}</div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        <Form onSubmit={onSubmit} noValidate>
          <div
            {...dropzone.getRootProps()}
            className={`upload-dropzone ${dropzone.isDragActive ? 'active' : ''} ${error ? 'is-invalid' : ''} ${fileValue ? 'has-file' : ''}`}
          >
            <input {...dropzone.getInputProps()} />
            {fileValue ? (
              <div className="selected-file">
                <div className="selected-file__icon"><FaFileExcel /></div>
                <div className="selected-file__copy">
                  <strong>{fileValue.name}</strong>
                  <span>{formatBytes(fileValue.size)} · Excel workbook</span>
                </div>
                <button type="button" className="selected-file__remove" onClick={(e) => { e.stopPropagation(); onClear(); }} aria-label="Remove selected file">
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className="dropzone-empty">
                <div className="dropzone-icon"><FaCloudUploadAlt /></div>
                <strong>{dropzone.isDragActive ? 'Drop the workbook here' : 'Drop Excel file here'}</strong>
                <span>or click to browse from your computer</span>
                <small>.XLSX or .XLS · Maximum 10 MB</small>
              </div>
            )}
          </div>
          {error && <div className="upload-field-error">{error}</div>}

          <div className="upload-checks">
            <span><FaCheckCircle /> Excel format only</span>
            <span><FaShieldAlt /> Existing validation preserved</span>
            <span><FaInfoCircle /> Review feedback after processing</span>
          </div>

          <div className="upload-template-line"><div><strong>Use the approved template</strong><span>Two SAMPLE rows show the format and are ignored automatically. Fill rows marked IMPORT; extra columns can be preserved as Custom Fields.</span></div><Button type="button" className="upload-secondary-btn" onClick={() => downloadTemplate(type)} disabled={loading}>Download template</Button></div>

          <div className="upload-actions">
            <Button type="submit" className="upload-primary-btn" disabled={loading || !fileValue}>
              {isCurrentLoading ? <><Spinner animation="border" size="sm" /> Processing…</> : <>{buttonLabel}<FaArrowRight /></>}
            </Button>
            {fileValue && <Button type="button" className="upload-secondary-btn" onClick={onClear} disabled={loading}>Clear file</Button>}
          </div>
        </Form>
      </section>
    );
  };

  return (
    <div className="upload-page-shell">
      <AgencySidebar
        role={isSuperadmin ? 'superadmin' : 'admin'}
        activeTab="upload"
        setActiveTab={(key) => navigate(`${dashboardPath}?tab=${key}`)}
        collapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout}
      />

      <main className={`upload-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="upload-main-inner">
          <header className="upload-page-header">
            <div>
              <div className="upload-page-kicker">DATA OPERATIONS</div>
              <h1>Excel Import Center</h1>
              <p>Import beneficiary records or apply JSR updates with downloadable templates, controlled validation and clear row-level feedback.</p>
            </div>
            <button className="upload-back-btn" onClick={() => navigate(`${dashboardPath}?tab=records`)}>
              <FaDatabase /> Farmer records
            </button>
          </header>

          <section className="upload-guidance-strip">
            <div><span>1</span><strong>Download & fill template</strong><small>Keep SAMPLE rows for reference; only IMPORT rows are processed.</small></div>
            <div><span>2</span><strong>Validate & process</strong><small>Format and size checks happen first.</small></div>
            <div><span>3</span><strong>Review outcome</strong><small>Resolve duplicates or failed rows if needed.</small></div>
          </section>

          <div className="upload-workflow-grid">
            <UploadPanel
              type="regular"
              title="Farmer data import"
              description="Add farmer records in bulk. Duplicate beneficiary records will be paused for review before final processing."
              fileValue={file}
              error={fileError}
              dropzone={regularDropzone}
              onSubmit={handleRegularUpload}
              onClear={() => reset('regular')}
              buttonLabel="Process farmer file"
            />
            <UploadPanel
              type="jsr"
              title="JSR bulk update"
              description="Update JSR Deviation to Yes for matching farmer records using the existing bulk-update workflow."
              fileValue={jsrFile}
              error={jsrFileError}
              dropzone={jsrDropzone}
              onSubmit={handleJsrUpload}
              onClear={() => reset('jsr')}
              buttonLabel="Process JSR update"
            />
          </div>

          <section className="upload-notes-card">
            <div><FaInfoCircle /></div>
            <div><strong>Before you upload</strong><p>Download the relevant template before preparing a workbook. Standard headers map automatically; extra beneficiary columns are retained as Custom Fields, while required fields continue to be validated.</p></div>
          </section>
        </div>
      </main>

      <Modal show={schemaModal.show} onHide={() => !loading && setSchemaModal((prev) => ({ ...prev, show: false }))} size="lg" centered backdrop="static">
        <Modal.Header closeButton={!loading}><div><div className="upload-page-kicker">COLUMN REVIEW</div><Modal.Title>Extra columns found</Modal.Title><p className="mb-0 mt-1 text-muted">Nothing has been written yet. Choose whether these workbook columns should be stored with each beneficiary.</p></div></Modal.Header>
        <Modal.Body>
          <div className="schema-review-summary"><strong>{schemaModal.columns.length}</strong><span>extra columns across {schemaModal.totalRows} rows</span></div>
          <div className="schema-review-list">{schemaModal.columns.map((column) => <article key={column.header}><div><strong>{column.header}</strong><span>{column.populatedRows} populated rows</span></div><p>{column.sampleValues?.length ? column.sampleValues.join(' · ') : 'No sample value available'}</p></article>)}</div>
          <div className="upload-notes-card mt-3"><div><FaInfoCircle /></div><div><strong>How extra columns are stored</strong><p>Included columns are preserved under the beneficiary's Custom Fields, so the original workbook data is not discarded and remains visible in record details and exports.</p></div></div>
        </Modal.Body>
        <Modal.Footer><Button variant="outline-secondary" disabled={loading} onClick={() => confirmSchemaDecision('ignore')}>Ignore extra columns</Button><Button disabled={loading} onClick={() => confirmSchemaDecision('include')}>{loading ? 'Processing…' : 'Include as Custom Fields'}</Button></Modal.Footer>
      </Modal>

      <DuplicateDecisionModal
        show={dupModal.show}
        duplicates={dupModal.duplicates}
        initialDecisions={dupModal.decisions}
        onConfirm={confirmDuplicates}
        onHide={() => setDupModal({ ...dupModal, show: false })}
      />

      <Modal show={jsrResultModal.show} onHide={() => setJsrResultModal({ ...jsrResultModal, show: false })} size="xl" centered dialogClassName="upload-result-modal">
        <Modal.Header closeButton>
          <div><div className="upload-page-kicker">PROCESSING RESULT</div><Modal.Title>JSR update summary</Modal.Title></div>
        </Modal.Header>
        <Modal.Body>
          <div className="result-summary"><FaCheckCircle /><div><strong>{jsrResultModal.updated}</strong><span>farmer records updated successfully</span></div></div>
          {(jsrResultModal.failedRecords.length || jsrResultModal.invalidRecords.length) ? (
            <div className="result-table-wrap">
              <div className="result-table-head"><strong>Records requiring attention</strong><span>{jsrResultModal.failedRecords.length + jsrResultModal.invalidRecords.length} rows</span></div>
              <Table responsive hover size="sm" className="result-table">
                <thead><tr><th>Excel row</th><th>Beneficiary ID</th><th>Name</th><th>Mobile</th><th>Aadhar No</th><th>Reason</th></tr></thead>
                <tbody>
                  {[...jsrResultModal.failedRecords, ...jsrResultModal.invalidRecords].map((rec, idx) => (
                    <tr key={idx}><td>{rec.row || '—'}</td><td>{rec.beneficiaryId || '—'}</td><td>{rec.beneficiaryName || '—'}</td><td>{rec.mobile || '—'}</td><td>{rec.aadharNo || '—'}</td><td>{rec.reason || 'Validation failed'}</td></tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button className="upload-primary-btn" onClick={() => { setJsrResultModal({ ...jsrResultModal, show: false }); reset('jsr'); }}>Done</Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-right" autoClose={3200} />
    </div>
  );
};

export default UploadExcel;
