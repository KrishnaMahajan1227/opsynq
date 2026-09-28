import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Container, Button, Alert, Form, Collapse } from 'react-bootstrap';
import {
  FaFilter,
  FaSyncAlt,
  FaCheck,
  FaClipboardCheck,
  FaTools,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaMapMarkerAlt,
  FaChevronRight,
  FaSlidersH,
  FaTimes,
} from 'react-icons/fa';
import axios from 'axios';
import FieldVerification from './FieldVerification';
import InstallationCompletionModal from '../components/InstallationCompletionModal';
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import './dashboard-technician.css';
import { MAHARASHTRA_DIVISIONS } from '../constants/maharashtraGeo';
import { API_URL } from '../config';

const TAB_META = {
  verification: { label: 'Verification', short: 'Verify', icon: FaClipboardCheck },
  installation: { label: 'Installation', short: 'Install', icon: FaTools },
  complaints: { label: 'Issues', short: 'Issues', icon: FaExclamationTriangle },
  completed: { label: 'Completed', short: 'Done', icon: FaCheckCircle },
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function DashboardTechnician() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [inspFilter, setInspFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [activeTab, setActiveTab] = useState('verification');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedId, setSelectedId] = useState(null);
  const [showVerify, setShowVerify] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showReworkInstall, setShowReworkInstall] = useState(false);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [technicianUsername, setTechnicianUsername] = useState('');
  const [surveyorMobile, setSurveyorMobile] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const token = localStorage.getItem('token');
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const fetchTechnicianUsername = useCallback(async () => {
    try {
      const resp = await axios.get(`${API_URL}/api/users/me`, auth);
      if (!resp.data || !resp.data.username) throw new Error('Technician profile is missing username.');
      setTechnicianUsername(resp.data.username);
      setSurveyorMobile(resp.data.mobile || '');
      setUsernameError('');
    } catch (err) {
      console.error(err);
      setUsernameError('Unable to load your technician profile. Please sign in again or contact support.');
    }
  }, [auth]);

  const fetchTasks = useCallback(async () => {
    try {
      const resp = await axios.get(`${API_URL}/api/farmers`, auth);
      const allTasks = Array.isArray(resp.data) ? resp.data : resp.data.farmers || [];
      setTasks(allTasks);
    } catch (err) {
      console.error(err);
      setUsernameError(prev => prev || 'Unable to refresh assigned work. Please check your connection and try again.');
    }
  }, [auth]);

  useEffect(() => { fetchTechnicianUsername(); }, [fetchTechnicianUsername]);

  useEffect(() => {
    if (technicianUsername) fetchTasks();
    let intervalId;
    if (activeTab === 'complaints' && technicianUsername) intervalId = setInterval(fetchTasks, 30000);
    return () => intervalId && clearInterval(intervalId);
  }, [fetchTasks, technicianUsername, activeTab]);

  const verificationTasks = useMemo(
    () => tasks.filter(t => t.inspectionStatus !== 'Completed' && t.surveyorMobile === surveyorMobile),
    [tasks, surveyorMobile]
  );

  const approvedInstallationTasks = useMemo(() => tasks.filter(t => {
    if (t.inspectionStatus === 'Completed' && t.surveyorMobile === surveyorMobile && (t.reworkAssignTechnician || t.surveyorName)) {
      const assignedTech = (t.reworkAssignTechnician || t.surveyorName).toLowerCase();
      const me = technicianUsername.toLowerCase();
      const allowedStatuses = ['Pending Approval', 'Pending Installation', 'Move to Installation', 'Ordered', 'Dispatch Completed', 'Ready for Installation'];
      return assignedTech === me && allowedStatuses.includes(t.applicationStatus);
    }
    return false;
  }), [tasks, surveyorMobile, technicianUsername]);

  const completedTasks = useMemo(() => tasks.filter(t => {
    if (t.surveyorMobile === surveyorMobile && (t.reworkAssignTechnician || t.surveyorName)) {
      const assignedTech = (t.reworkAssignTechnician || t.surveyorName).toLowerCase();
      const me = technicianUsername.toLowerCase();
      return assignedTech === me && ['Installation Completed', 'Closed'].includes(t.applicationStatus);
    }
    return false;
  }), [tasks, surveyorMobile, technicianUsername]);

  const complaintTasks = useMemo(() => tasks.filter(t => {
    if (t.applicationStatus === 'Complaint Raised' && (t.reworkAssignTechnician || t.surveyorName)) {
      const assignedTech = (t.reworkAssignTechnician || t.surveyorName).toLowerCase();
      return assignedTech === technicianUsername.toLowerCase();
    }
    return false;
  }), [tasks, technicianUsername]);

  const tabLists = useMemo(() => ({
    verification: verificationTasks,
    installation: approvedInstallationTasks,
    complaints: complaintTasks,
    completed: completedTasks,
  }), [verificationTasks, approvedInstallationTasks, complaintTasks, completedTasks]);

  const applyFilters = useCallback(list => list.filter(t => {
    const term = search.trim().toLowerCase();
    if (term && ![t.beneficiaryName, t.beneficiaryId, t.aadharNo, t.villageName, t.village, t.district].some(v => String(v || '').toLowerCase().includes(term))) return false;
    if (districtFilter && t.district !== districtFilter) return false;
    if (divisionFilter && t.divisionName !== divisionFilter) return false;
    if (statusFilter && t.applicationStatus !== statusFilter) return false;
    if (inspFilter && t.inspectionStatus !== inspFilter) return false;
    if (vendorFilter && t.assignedVendorCompanyName !== vendorFilter) return false;
    return true;
  }), [search, districtFilter, divisionFilter, statusFilter, inspFilter, vendorFilter]);

  const sortTasks = useCallback(list => [...list].sort((a, b) => {
    if (sortBy === 'name') return String(a.beneficiaryName || '').localeCompare(String(b.beneficiaryName || ''));
    if (sortBy === 'location') return String(a.district || '').localeCompare(String(b.district || '')) || String(a.villageName || a.village || '').localeCompare(String(b.villageName || b.village || ''));
    if (sortBy === 'newest') {
      const ad = new Date(a.reworkAssignDate || a.updatedAt || a.createdAt || 0).getTime();
      const bd = new Date(b.reworkAssignDate || b.updatedAt || b.createdAt || 0).getTime();
      return bd - ad;
    }
    const priority = {
      'Ready for Installation': 1,
      Ordered: 2,
      'Complaint Raised': 1,
      'Pending Approval': 3,
      'Pending Installation': 4,
      'Move to Installation': 5,
      'Dispatch Completed': 6,
    };
    const ap = priority[a.applicationStatus] || (a.inspectionStatus === 'In Progress' ? 1 : 10);
    const bp = priority[b.applicationStatus] || (b.inspectionStatus === 'In Progress' ? 1 : 10);
    return ap - bp;
  }), [sortBy]);

  const filteredCurrent = useMemo(() => sortTasks(applyFilters(tabLists[activeTab])), [sortTasks, applyFilters, tabLists, activeTab]);
  const totalPages = Math.max(1, Math.ceil(filteredCurrent.length / pageSize));
  const pagedCurrent = filteredCurrent.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = filteredCurrent.length ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, filteredCurrent.length);
  const activeFilterCount = [districtFilter, divisionFilter, statusFilter, inspFilter, vendorFilter].filter(Boolean).length;
  const hasFilters = !!(search || activeFilterCount);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTasks();
    setIsRefreshing(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setDistrictFilter('');
    setDivisionFilter('');
    setStatusFilter('');
    setInspFilter('');
    setVendorFilter('');
    setPage(1);
  };

  const onVerifyDone = async () => { setShowVerify(false); setSelectedId(null); await fetchTasks(); };
  const onInstallDone = async () => { setShowInstall(false); setSelectedId(null); await fetchTasks(); };
  const onReworkInstallDone = async () => { setShowReworkInstall(false); setSelectedId(null); await fetchTasks(); };
  const onOrderConfirmDone = async () => { setShowOrderConfirm(false); setSelectedId(null); await fetchTasks(); };

  const statusClass = status => {
    if (['Completed', 'Installation Completed', 'Closed', 'Ready for Installation', 'Resolved'].includes(status)) return 'is-success';
    if (['Complaint Raised', 'Pending', 'Pending Approval', 'Pending Installation'].includes(status)) return 'is-attention';
    return 'is-neutral';
  };

  const taskStatus = task => {
    if (activeTab === 'verification') return task.inspectionStatus || 'Pending';
    if (activeTab === 'completed') return task.applicationStatus || 'Completed';
    if (activeTab === 'complaints') return task.solutionDate ? 'Resolved' : 'Pending';
    return task.applicationStatus || 'Pending';
  };

  const renderTaskAction = task => {
    if (activeTab === 'verification') {
      return <Button className="td-primary-action" onClick={() => { setSelectedId(task._id); setShowVerify(true); }}>Start <FaChevronRight /></Button>;
    }
    if (activeTab === 'installation') {
      if (task.applicationStatus === 'Ordered') {
        return <Button className="td-primary-action" onClick={() => { setSelectedId(task._id); setShowOrderConfirm(true); }}><FaCheck /> Confirm receipt</Button>;
      }
      if (task.applicationStatus === 'Ready for Installation') {
        return <Button className="td-primary-action" onClick={() => { setSelectedId(task._id); setShowInstall(true); }}>Complete <FaChevronRight /></Button>;
      }
      const waiting = {
        'Pending Approval': 'Awaiting approval',
        'Pending Installation': 'Awaiting admin',
        'Move to Installation': 'Awaiting approval',
        'Dispatch Completed': 'Awaiting approval',
      };
      return <span className="td-no-action">{waiting[task.applicationStatus] || 'No action needed'}</span>;
    }
    if (activeTab === 'complaints' && !task.solutionDate) {
      return <Button className="td-primary-action" onClick={() => { setSelectedId(task._id); setShowReworkInstall(true); }}>Start rework <FaChevronRight /></Button>;
    }
    return <span className="td-complete-label"><FaCheckCircle /> Completed</span>;
  };

  const districtOptions = useMemo(() => MAHARASHTRA_DIVISIONS
    .flatMap(d => d.districts.map(x => x.name))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort(), []);
  const vendorOptions = useMemo(() => [...new Set(tasks.map(t => t.assignedVendorCompanyName).filter(Boolean))].sort(), [tasks]);

  return (
    <Container fluid className="td-root">
      {usernameError && <Alert variant="danger" className="td-alert-error">{usernameError}</Alert>}

      <header className="td-header">
        <div>
          <span className="td-eyebrow">Field operations</span>
          <h1>My work</h1>
          <p>{technicianUsername || 'Loading profile'}{surveyorMobile ? ` · ${surveyorMobile}` : ''}</p>
        </div>
        <Button className="td-icon-button" onClick={handleRefresh} disabled={isRefreshing} aria-label="Refresh assigned work" title="Refresh">
          <FaSyncAlt className={isRefreshing ? 'td-spin' : ''} />
        </Button>
      </header>

      <nav className="td-queue-tabs" aria-label="Work queues">
        {Object.entries(TAB_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const count = tabLists[key].length;
          return (
            <button key={key} className={activeTab === key ? 'is-active' : ''} onClick={() => { setActiveTab(key); setPage(1); }}>
              <Icon />
              <span>{meta.short}</span>
              <b>{count > 999 ? '999+' : count}</b>
            </button>
          );
        })}
      </nav>

      <section className="td-commandbar">
        <div className="td-search-wrap">
          <FaSearch />
          <Form.Control
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, ID, Aadhaar or location"
            aria-label="Search assigned work"
          />
          {search && <button className="td-clear-search" onClick={() => { setSearch(''); setPage(1); }} aria-label="Clear search"><FaTimes /></button>}
        </div>
        <Button className={`td-filter-button ${activeFilterCount ? 'is-active' : ''}`} onClick={() => setShowFilters(v => !v)} aria-expanded={showFilters}>
          <FaSlidersH /><span>Filter</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}
        </Button>
        <Form.Select className="td-sort" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} aria-label="Sort tasks">
          <option value="priority">Priority first</option>
          <option value="newest">Recently updated</option>
          <option value="name">Name A–Z</option>
          <option value="location">Location</option>
        </Form.Select>
      </section>

      <Collapse in={showFilters}>
        <section className="td-filter-panel">
          <div className="td-filter-head">
            <div><FaFilter /><strong>Refine list</strong></div>
            {activeFilterCount > 0 && <button type="button" onClick={handleClearFilters}>Clear filters</button>}
          </div>
          <div className="td-filter-grid">
            <label>District<Form.Select value={districtFilter} onChange={e => { setDistrictFilter(e.target.value); setPage(1); }}><option value="">All districts</option>{districtOptions.map(v => <option key={v}>{v}</option>)}</Form.Select></label>
            <label>Division<Form.Select value={divisionFilter} onChange={e => { setDivisionFilter(e.target.value); setPage(1); }}><option value="">All divisions</option>{MAHARASHTRA_DIVISIONS.map(d => d.name).filter((v,i,a) => a.indexOf(v) === i).sort().map(v => <option key={v}>{v}</option>)}</Form.Select></label>
            <label>Vendor<Form.Select value={vendorFilter} onChange={e => { setVendorFilter(e.target.value); setPage(1); }}><option value="">All vendors</option>{vendorOptions.map(v => <option key={v}>{v}</option>)}</Form.Select></label>
            <label>Application status<Form.Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">All statuses</option>{['Pending Approval','Pending Installation','Move to Installation','Ordered','Dispatch Completed','Ready for Installation','Installation Completed','Complaint Raised','Closed'].map(v => <option key={v}>{v}</option>)}</Form.Select></label>
            <label>Survey status<Form.Select value={inspFilter} onChange={e => { setInspFilter(e.target.value); setPage(1); }}><option value="">All statuses</option>{['Pending','In Progress','Completed'].map(v => <option key={v}>{v}</option>)}</Form.Select></label>
          </div>
        </section>
      </Collapse>

      <section className="td-list-shell">
        <div className="td-list-head">
          <div>
            <h2>{TAB_META[activeTab].label}</h2>
            <span>{filteredCurrent.length} {filteredCurrent.length === 1 ? 'assignment' : 'assignments'}</span>
          </div>
          <div className="td-list-controls">
            <span className="td-range">{rangeStart}–{rangeEnd} of {filteredCurrent.length}</span>
            <Form.Select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} aria-label="Rows per page">
              {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size} / page</option>)}
            </Form.Select>
          </div>
        </div>

        {pagedCurrent.length === 0 ? (
          <div className="td-empty">
            <div className="td-empty-icon"><FaCheckCircle /></div>
            <h3>No assignments found</h3>
            <p>{hasFilters ? 'No records match your current search or filters.' : 'There is no assigned work in this queue right now.'}</p>
            {hasFilters && <Button onClick={handleClearFilters}>Clear search & filters</Button>}
          </div>
        ) : (
          <div className="td-task-list">
            {pagedCurrent.map((task, index) => {
              const status = taskStatus(task);
              const location = [task.villageName || task.village, task.taluka, task.district].filter(Boolean).join(', ') || 'Location unavailable';
              const itemNumber = (page - 1) * pageSize + index + 1;
              return (
                <article className="td-task-row" key={task._id}>
                  <span className="td-row-number" aria-hidden="true">{itemNumber}</span>
                  <div className="td-task-identity">
                    <div className="td-name-line">
                      <h3>{task.beneficiaryName || 'Unnamed beneficiary'}</h3>
                      <span className={`td-status ${statusClass(status)}`}>{status}</span>
                    </div>
                    <div className="td-id-line">Beneficiary ID&nbsp; <strong>{task.beneficiaryId || '—'}</strong></div>
                    <div className="td-location"><FaMapMarkerAlt /> <span>{location}</span></div>
                    {activeTab === 'complaints' && (
                      <div className="td-complaint-summary">
                        <strong>{task.complaintIssue || 'Complaint details not provided'}</strong>
                        {task.issues && <span>{task.issues}</span>}
                      </div>
                    )}
                  </div>
                  <div className="td-secondary-info">
                    {task.assignedVendorCompanyName && <div><span>Vendor</span><strong>{task.assignedVendorCompanyName}</strong></div>}
                    {activeTab === 'complaints' && task.reworkAssignDate && <div><span>Assigned</span><strong>{new Date(task.reworkAssignDate).toLocaleDateString('en-IN')}</strong></div>}
                  </div>
                  <div className="td-task-action">{renderTaskAction(task)}</div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="td-pagination">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span>{page} / {totalPages}</span>
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        )}
      </section>

      {showVerify && <FieldVerification farmerId={selectedId} onVerificationComplete={onVerifyDone} />}
      {showInstall && <InstallationCompletionModal show handleClose={() => setShowInstall(false)} farmer={tasks.find(t => t._id === selectedId)} onInstallationComplete={onInstallDone} />}
      {showReworkInstall && <InstallationCompletionModal show handleClose={() => setShowReworkInstall(false)} farmer={tasks.find(t => t._id === selectedId)} onInstallationComplete={onReworkInstallDone} />}
      {showOrderConfirm && <OrderConfirmationModal show handleClose={() => setShowOrderConfirm(false)} farmer={tasks.find(t => t._id === selectedId)} onOrderConfirmed={onOrderConfirmDone} technicianUsername={technicianUsername} />}
    </Container>
  );
}
