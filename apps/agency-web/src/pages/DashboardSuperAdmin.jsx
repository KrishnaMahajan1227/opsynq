// src/pages/DashboardSuperAdmin.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Nav,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Toast,
  Modal,
  OverlayTrigger,
  Tooltip,
  Accordion,
  Spinner,
  Collapse,
  Alert,
} from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import {
  FaChartPie,
  FaUsers,
  FaSyncAlt,
  FaCheckCircle,
  FaPrint,
  FaBars,
  FaTimes,
  FaDatabase,
  FaTools,
  FaCheck,
  FaExclamationTriangle,
  FaUserCog,
  FaEdit,
  FaTrash,
  FaPlus,
  FaFileAlt,
  FaUpload,
  FaSignOutAlt,
  FaFilter,
  FaArrowLeft,
} from 'react-icons/fa';
import axios from 'axios';
import debounce from 'lodash/debounce';
import EditFarmerModal from '../components/EditFarmerModal';
import FarmerDetailView from '../components/FarmerDetailView';
import OrderPlacementModal from '../components/OrderPlacementModal';
import TechLocationMonitor from '../components/TechLocationMonitor';
import TechLocationMap from '../components/TechLocationMap';
import { MAHARASHTRA_DIVISIONS } from '../constants/maharashtraGeo';
import './dashboard-superadmin.css';
import './AdminEnterprise.css';
import { API_URL } from '../config';
import { getAgencyCached } from '../resilientAxios';
import AgencySidebar from '../components/AgencySidebar';
import AgencyWorkspaceHeader from '../components/AgencyWorkspaceHeader';
import MaterialReceiptsPanel from '../components/MaterialReceiptsPanel';
import AgencyRmsPanel,{AgencyRmsSummary} from '../components/AgencyRmsPanel';
import AgencyReportsPanel from '../components/AgencyReportsPanel';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend);

const APPLICATION_STATUSES = [
  'Pending',
  'Pending Installation',
  'Move to Installation',
  'Ordered',
  'Dispatch Completed',
  'Ready for Installation',
  'Installation Completed',
  'Complaint Raised',
  'Closed',
];
const INSPECTION_STATUSES = ['Pending', 'In Progress', 'Completed'];
const INSPECTION_STATUS_FINAL_VALUES = [
  '',
  'Blocked for further process because PP consumer number of other consumer used',
  'VENDOR INFORMATION RECEIVED',
  'Refund Process Completed and Amount transferred to Beneficiary',
  'PUMP INSTALLATION DETAILS RECEIVED FROM VENDOR',
  'PUMP INSTALLATION INSPECTION DONE BY LINEMAN',
  'SYSTEM DETAILS SUBMITTED',
];
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
];

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();
  // ─── State Management ─────────────────────────────────────────────────────
  const [farmers, setFarmers] = useState([]);
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  // Farmer tab states
  const [selectedFarmers, setSelectedFarmers] = useState([]);
  const [bulkSurveyor, setBulkSurveyor] = useState('');
  const [bulkInspectionStatusFinal, setBulkInspectionStatusFinal] = useState('');
  const [searchName, setSearchName] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [talukaFilter, setTalukaFilter] = useState('');
  const [surveyorFilter, setSurveyorFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [jsrFilter, setJsrFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  const [inspectionFilter, setInspectionFilter] = useState('');
  const [inspectionStatusFinalFilter, setInspectionStatusFinalFilter] = useState('');
  const [schemeGroupFilter, setSchemeGroupFilter] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('');
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);

  // Tabs & loading
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [opsFiltersOpen, setOpsFiltersOpen] = useState('');
  const [opsDistrictFilter, setOpsDistrictFilter] = useState('');
  const [opsSurveyorFilter, setOpsSurveyorFilter] = useState('');
  const [opsStatusFilter, setOpsStatusFilter] = useState('');
  const [detailFarmer, setDetailFarmer] = useState(null);
  const [installationSearch, setInstallationSearch] = useState('');
  const [completedSearch, setCompletedSearch] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  useEffect(() => {
    setOpsFiltersOpen('');
    setOpsDistrictFilter('');
    setOpsSurveyorFilter('');
    setOpsStatusFilter('');
  }, [activeTab]);

  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Farmer modals
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [orderFarmer, setOrderFarmer] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAssignTechnicianModal, setShowAssignTechnicianModal] = useState(false);

  const [reworkData, setReworkData] = useState({});
  const [assignTechnicianForm, setAssignTechnicianForm] = useState({
    surveyorName: '',
    surveyorMobile: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    beneficiaryId: '',
    beneficiaryName: '',
    district: '',
    taluka: '',
    village: '',
    mobile: '',
    aadharNo: '',
    pumpType: '',
    pumpHP: '',
    controllerTypeWithOrWithout: '',
    siteLocation: '',
    siteDepth: '',
    actualHeadM: '',
    surveyDate: '',
    surveyorName: '',
    surveyorMobile: '',
    inspectionStatus: '',
    jsrDeviationYesNo: '',
    inspectionStatusFinal: '',
    deviationRemarks: '',
    pumpNoUnique: '',
    motorNoUnique: '',
    controllerNoUnique: '',
    imeiNoUnique: '',
    panels: [],
    installationDoneYesNo: '',
    pumpNotOperatingYesNo: '',
    companyAssignedPersonName: '',
    chargesToDebit: '',
    subcontractorRate: '',
    subcontractorBill: '',
    paymentGivenToSubcontractor: '',
    paymentPending: '',
    farmerPhoto: '',
    farmerSignature: '',
    sitePhotos: '',
  });

  // Technician Summary states
  const [showManagePaymentsModal, setShowManagePaymentsModal] = useState(false);
  const [manageTech, setManageTech] = useState(null);
  const [manageTechFarmers, setManageTechFarmers] = useState([]);
  const [monthFilter, setMonthFilter] = useState('');

  // User Management states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '',
    role: 'admin',
  });
  const [userLoading, setUserLoading] = useState(false);
  const [bulkInspectionStatus, setBulkInspectionStatus] = useState('');

  // Auth headers
  const role = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // Filter Dropdown Data from MAHARASHTRA_DIVISIONS
  const allDivisions = MAHARASHTRA_DIVISIONS.map((div) => div.name).sort();
  const allDistricts = MAHARASHTRA_DIVISIONS.flatMap((div) => div.districts.map((d) => d.name)).sort();
  const allTalukas = (districtName) => {
    const found = MAHARASHTRA_DIVISIONS.flatMap((div) =>
      div.districts.filter((d) => d.name === districtName)
    )[0];
    return found ? found.talukas.sort() : [];
  };

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const applyFarmerList = (list) => {
    const rows = Array.isArray(list) ? list : list?.farmers || [];
    setFarmers(rows);
    const initialReworkData = {};
    rows.forEach((f) => {
      if (f.applicationStatus === 'Complaint Raised') initialReworkData[f._id] = {
        reWork: f.reWork || '', issues: f.issues || '', reworkAssignTechnician: f.reworkAssignTechnician || '', reworkAssignTechnicianDate: f.reworkAssignDate || '', solutionDate: f.solutionDate || '',
      };
    });
    setReworkData(initialReworkData);
  };

  const fetchFarmers = async () => {
    setIsLoading(true);
    const url = `${API_URL}/api/farmers`;
    let renderedCache = false;
    try {
      const cached = await getAgencyCached(url, { maxAge: 6 * 60 * 60 * 1000 });
      if (cached?.data) { applyFarmerList(cached.data); renderedCache = true; setIsLoading(false); }
      const response = await axios.get(url, { ...auth, opsynqNoCache: true });
      applyFarmerList(response.data);
    } catch (error) {
      console.error('Failed to fetch farmers:', error);
      if (!renderedCache) setToast({ show: true, variant: 'danger', message: 'Failed to fetch farmers' });
    } finally { setIsLoading(false); }
  };

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/users`, auth);
      const userList = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.users)
        ? response.data.users
        : [];
      setUsers(userList);
      setTechnicians(userList.filter((u) => u.role === 'field_technician'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setToast({ show: true, variant: 'danger', message: 'Failed to fetch users' });
    } finally {
      setUserLoading(false);
    }
  };

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!token) throw new Error('Authentication token is missing. Please log in again.');
      const response = await axios.get(`${API_URL}/api/farmers/requests`, auth);
      const data = Array.isArray(response.data) ? response.data : [];
      setRequests(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setRequests([]);
      setError('Failed to load requests. Please try again later.');
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to fetch requests: ${error.response?.data?.message || error.message}`,
      });
      if (error.message.includes('Authentication token')) {
        window.location.href = import.meta.env.PROD ? '/?login=1' : '/';
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, auth]);

  const handleApproveRequest = async (requestId) => {
    try {
      await axios.post(`${API_URL}/api/farmers/change-requests/${requestId}/approve`, {}, auth);
      setToast({
        show: true,
        variant: 'success',
        message: 'Request approved successfully',
      });
      fetchRequests();
    } catch (error) {
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to approve request: ${error.response?.data?.message || error.message}`,
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.post(`${API_URL}/api/farmers/change-requests/${requestId}/reject`, {}, auth);
      setToast({
        show: true,
        variant: 'success',
        message: 'Request rejected successfully',
      });
      fetchRequests();
    } catch (error) {
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to reject request: ${error.response?.data?.message || error.message}`,
      });
    }
  };

  useEffect(() => {
    Promise.all([fetchFarmers(), fetchUsers(), fetchRequests()]).catch((err) => {
      console.error('Initial fetch failed:', err);
      setToast({ show: true, variant: 'danger', message: 'Initial data fetch failed' });
    });
  }, []);

  useEffect(() => {
    if (activeTab !== 'complaints' && activeTab !== 'requests') return undefined;
    const intervalId = setInterval(() => {
      if (activeTab === 'complaints') fetchFarmers();
      if (activeTab === 'requests') fetchRequests();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [activeTab, fetchRequests]);

  useEffect(() => {
    setSchemeFilter('');
    setPage(1);
  }, [schemeGroupFilter]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchFarmers(), fetchUsers(), fetchRequests()]);
      setToast({ show: true, variant: 'success', message: 'Data refreshed successfully' });
    } catch (error) {
      console.error('Refresh failed:', error);
      setToast({ show: true, variant: 'danger', message: 'Failed to refresh data' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Debounced Search ─────────────────────────────────────────────────────
  const debouncedSetSearchName = debounce((value) => {
    setSearchName(value);
    setPage(1);
  }, 300);

  // ─── Helper Functions ────────────────────────────────────────────────────
  const getTechnicianDisplay = (username) => {
    if (!username) return 'Not Assigned';
    const technician = users.find((u) => u.username === username);
    return technician ? `${technician.username} (${technician.mobile})` : username;
  };

  const isPendingTooLong = (farmer) => {
    if (farmer.applicationStatus !== 'Dispatch Completed') return false;
    if (farmer.materialReceivedConfirmationYesNo !== 'Yes') return false;
    const confirmedAt = farmer.confirmationDate;
    if (!confirmedAt) return false;
    const now = new Date();
    const diffMs = now - new Date(confirmedAt);
    const diffMins = diffMs / (1000 * 60);
    return diffMins > 5;
  };

  // ─── USER MANAGEMENT HANDLERS ────────────────────────────────────────────
  const openNewUserModal = () => {
    setEditingUser(null);
    setUserForm({ username: '', email: '', mobile: '', password: '', role: 'admin' });
    setShowUserModal(true);
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email || '',
      mobile: user.mobile,
      password: '',
      role: user.role,
    });
    setShowUserModal(true);
  };

  const handleUserFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitUserForm = async (e) => {
    e.preventDefault();
    setUserLoading(true);
    try {
      if (editingUser) {
        await axios.put(`${API_URL}/api/users/update/${editingUser._id}`, userForm, auth);
        setToast({ show: true, variant: 'success', message: 'User updated successfully' });
      } else {
        await axios.post(`${API_URL}/api/users/register`, userForm, auth);
        setToast({ show: true, variant: 'success', message: 'User registered successfully' });
      }
      setShowUserModal(false);
      await fetchUsers();
    } catch (error) {
      console.error('User save failed:', error);
      const msg = error.response?.data?.message || 'User save failed';
      setToast({ show: true, variant: 'danger', message: msg });
    } finally {
      setUserLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/api/users/${userId}`, auth);
      setToast({ show: true, variant: 'success', message: 'User deleted successfully' });
      await fetchUsers();
    } catch (error) {
      console.error('Delete user failed:', error);
      setToast({ show: true, variant: 'danger', message: 'Delete user failed' });
    }
  };

  // ─── FARMER HANDLERS ──────────────────────────────────────────────────────
  const handleBulkSurveyorUpdate = async () => {
    if (selectedFarmers.length === 0) {
      setToast({ show: true, variant: 'danger', message: 'Please select at least one farmer' });
      return;
    }
    if (!bulkSurveyor) {
      setToast({ show: true, variant: 'danger', message: 'Please select a surveyor' });
      return;
    }
    try {
      const selectedSurveyor = technicians.find((u) => u.username === bulkSurveyor);
      if (!selectedSurveyor || selectedSurveyor.role !== 'field_technician') {
        setToast({ show: true, variant: 'danger', message: 'Invalid surveyor selected' });
        return;
      }
      await axios.post(
        `${API_URL}/api/farmers/bulk-update`,
        {
          farmerIds: selectedFarmers,
          update: {
            surveyorName: selectedSurveyor.username,
            surveyorMobile: selectedSurveyor.mobile,
          },
        },
        auth
      );
      setSelectedFarmers([]);
      setBulkSurveyor('');
      await fetchFarmers();
      setToast({ show: true, variant: 'success', message: 'Surveyors updated successfully' });
    } catch (error) {
      console.error('Failed to bulk update surveyors:', error);
      setToast({
        show: true,
        variant: 'danger',
        message: error.response?.data?.message || 'Failed to update surveyors',
      });
    }
  };

  const handleBulkInspectionStatusUpdate = async () => {
    if (selectedFarmers.length === 0) {
      setToast({ show: true, variant: 'danger', message: 'Please select at least one farmer' });
      return;
    }
    if (bulkInspectionStatus !== 'Completed') {
      setToast({ show: true, variant: 'danger', message: 'Please select Completed status' });
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/farmers/bulk-update`,
        {
          farmerIds: selectedFarmers,
          update: { inspectionStatus: bulkInspectionStatus },
        },
        auth
      );
      setSelectedFarmers([]);
      setBulkInspectionStatus('');
      await fetchFarmers();
      setToast({ show: true, variant: 'success', message: 'Inspection statuses updated successfully' });
    } catch (error) {
      console.error('Failed to bulk update inspection statuses:', error);
      setToast({
        show: true,
        variant: 'danger',
        message: error.response?.data?.message || 'Failed to update inspection statuses',
      });
    }
  };

  const handleBulkInspectionStatusFinalUpdate = async () => {
    if (selectedFarmers.length === 0) {
      setToast({ show: true, variant: 'danger', message: 'Please select at least one farmer' });
      return;
    }
    if (!bulkInspectionStatusFinal) {
      setToast({ show: true, variant: 'danger', message: 'Please select a final inspection status' });
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/farmers/bulk-update`,
        {
          farmerIds: selectedFarmers,
          update: { inspectionStatusFinal: bulkInspectionStatusFinal },
        },
        auth
      );
      setSelectedFarmers([]);
      setBulkInspectionStatusFinal('');
      await fetchFarmers();
      setToast({ show: true, variant: 'success', message: 'Final inspection statuses updated successfully' });
    } catch (error) {
      console.error('Failed to bulk update final inspection statuses:', error);
      setToast({
        show: true,
        variant: 'danger',
        message: error.response?.data?.message || 'Failed to update final inspection statuses',
      });
    }
  };

  const toggleFarmerSelection = (farmerId) => {
    setSelectedFarmers((prev) =>
      prev.includes(farmerId) ? prev.filter((id) => id !== farmerId) : [...prev, farmerId]
    );
  };

  const handleStatusChange = async (id, newStatus, f) => {
    if (f.applicationStatus === 'Complaint Raised' && !f.solutionDate) {
      setToast({
        show: true,
        variant: 'danger',
        message: 'Cannot change status until complaint is resolved',
      });
      return;
    }
    if (newStatus === 'Move to Installation' && (f.jsrDeviationYesNo !== 'JSR OUTCOME ACCEPTED' || f.inspectionStatus !== 'Completed')) {
      setToast({
        show: true,
        variant: 'danger',
        message: 'Requires JSR=JSR OUTCOME ACCEPTED and Inspection=Completed',
      });
      return;
    }
    if (newStatus === 'Ready for Installation' && f.applicationStatus !== 'Dispatch Completed') {
      setToast({
        show: true,
        variant: 'danger',
        message: 'Order must be Dispatch Completed before marking Ready for Installation',
      });
      return;
    }
    if (newStatus === 'Closed' && f.applicationStatus !== 'Installation Completed') {
      setToast({
        show: true,
        variant: 'danger',
        message: 'Installation must be completed before closing',
      });
      return;
    }

    try {
      const updatePayload = { applicationStatus: newStatus };
      if (newStatus === 'Ready for Installation') {
        if (!assignTechnicianForm.surveyorName) {
          setToast({ show: true, variant: 'danger', message: 'Please select a technician' });
          return;
        }
        updatePayload.surveyorName = assignTechnicianForm.surveyorName;
        updatePayload.surveyorMobile = assignTechnicianForm.surveyorMobile;
      }
      await axios.put(`${API_URL}/api/farmers/${id}`, updatePayload, auth);
      await fetchFarmers();
      setToast({ show: true, variant: 'success', message: 'Application status updated' });
      setShowAssignTechnicianModal(false);
      setAssignTechnicianForm({ surveyorName: '', surveyorMobile: '' });
    } catch (error) {
      console.error('Failed to update status:', error);
      setToast({ show: true, variant: 'danger', message: 'Failed to update status' });
    }
  };

  const handleJSRChange = async (id, newJSR) => {
    try {
      await axios.put(`${API_URL}/api/farmers/${id}`, { jsrDeviationYesNo: newJSR }, auth);
      await fetchFarmers();
      setToast({ show: true, variant: 'success', message: 'JSR updated' });
    } catch (error) {
      console.error('Failed to update JSR:', error);
      setToast({ show: true, variant: 'danger', message: 'Failed to update JSR' });
    }
  };

  const handleInspectionStatusFinalChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/farmers/${id}`, { inspectionStatusFinal: newStatus }, auth);
      await fetchFarmers();
      setToast({ show: true, variant: 'success', message: 'Final inspection status updated' });
    } catch (error) {
      console.error('Failed to update final inspection status:', error);
      setToast({
        show: true,
        variant: 'danger',
        message: error.response?.data?.message || 'Failed to update final inspection status',
      });
    }
  };

  const handleReworkSubmit = async (farmerId) => {
    const data = reworkData[farmerId];
    if (!data?.reWork || !data?.issues || !data?.reworkAssignTechnician) {
      setToast({
        show: true,
        variant: 'danger',
        message: 'Please fill all required rework fields',
      });
      return;
    }
    try {
      const updatePayload = {
        reWork: data.reWork,
        issues: data.issues,
        reworkAssignTechnician: data.reworkAssignTechnician,
        reworkAssignDate: new Date().toISOString(),
        solutionDate: data.solutionDate || '',
      };
      await axios.put(`${API_URL}/api/farmers/${farmerId}`, updatePayload, auth);
      await fetchFarmers();
      setToast({ show: true, variant: 'success', message: 'Complaint updated for rework' });
    } catch (error) {
      console.error('Failed to update complaint:', error);
      setToast({ show: true, variant: 'danger', message: 'Failed to update complaint' });
    }
  };

  const updateReworkData = (farmerId, field, value) => {
    setReworkData((prev) => ({
      ...prev,
      [farmerId]: {
        ...prev[farmerId],
        [field]: value,
      },
    }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const requiredFields = [
      'chargesToDebit',
      'subcontractorRate',
      'subcontractorBill',
      'paymentGivenToSubcontractor',
      'paymentPending',
    ];
    if (requiredFields.some((field) => !paymentForm[field] || parseFloat(paymentForm[field]) < 0)) {
      setToast({
        show: true,
        variant: 'danger',
        message: 'Please fill all payment fields with valid non-negative values',
      });
      return;
    }
    try {
      const updatePayload = {
        ...paymentForm,
        panels: Array.isArray(paymentForm.panels)
          ? paymentForm.panels
          : paymentForm.panels.split(',').map((p) => p.trim()).filter((p) => p),
        sitePhotos: paymentForm.sitePhotos
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p),
        applicationStatus: 'Closed',
      };
      await axios.put(`${API_URL}/api/farmers/${selectedFarmer._id}`, updatePayload, auth);
      setShowPaymentModal(false);
      setSelectedFarmer(null);
      setPaymentForm({
        beneficiaryId: '',
        beneficiaryName: '',
        district: '',
        taluka: '',
        village: '',
        mobile: '',
        aadharNo: '',
        pumpType: '',
        pumpHP: '',
        controllerTypeWithOrWithout: '',
        siteLocation: '',
        siteDepth: '',
        actualHeadM: '',
        surveyDate: '',
        surveyorName: '',
        surveyorMobile: '',
        inspectionStatus: '',
        jsrDeviationYesNo: '',
        inspectionStatusFinal: '',
        deviationRemarks: '',
        pumpNoUnique: '',
        motorNoUnique: '',
        controllerNoUnique: '',
        imeiNoUnique: '',
        panels: [],
        installationDoneYesNo: '',
        pumpNotOperatingYesNo: '',
        companyAssignedPersonName: '',
        chargesToDebit: '',
        subcontractorRate: '',
        subcontractorBill: '',
        paymentGivenToSubcontractor: '',
        paymentPending: '',
        farmerPhoto: '',
        farmerSignature: '',
        sitePhotos: '',
      });
      await fetchFarmers();
      setToast({ show: true, variant: 'success', message: 'Farmer record closed successfully' });
    } catch (error) {
      console.error('Failed to update payment details:', error);
      setToast({ show: true, variant: 'danger', message: 'Failed to update payment details' });
    }
  };

  const handleTechnicianChange = (e) => {
    const username = e.target.value;
    const selectedTechnician = technicians.find((t) => t.username === username);
    setPaymentForm((prev) => ({
      ...prev,
      surveyorName: username,
      surveyorMobile: selectedTechnician ? selectedTechnician.mobile : '',
    }));
  };

  const handleAssignTechnicianChange = (e) => {
    const username = e.target.value;
    const selectedTechnician = technicians.find((t) => t.username === username);
    setAssignTechnicianForm({
      surveyorName: username,
      surveyorMobile: selectedTechnician ? selectedTechnician.mobile : '',
    });
  };

  const downloadFilteredCSV = () => {
    const listToExport =
      selectedFarmers.length > 0
        ? farmers.filter((f) => selectedFarmers.includes(f._id))
        : filtered;

    if (listToExport.length === 0) {
      alert('No farmers to export.');
      return;
    }

    const allKeysSet = new Set();
    listToExport.forEach((f) => {
      Object.keys(f).forEach((k) => {
        if (!['__v', 'createdAt', 'updatedAt', '_id'].includes(k)) {
          allKeysSet.add(k);
        }
      });
    });
    const allKeys = Array.from(allKeysSet).sort();

    const headerRow = allKeys.join(',');
    const rows = listToExport.map((f) => {
      return allKeys.map((key) => {
        let val = f[key];
        if (Array.isArray(val)) {
          const joined = val.map((v) => v?.toString().replace(/"/g, '""')).join(';');
          return `"${joined}"`;
        }
        const maybeDate = new Date(val);
        if (!Number.isNaN(maybeDate.getTime()) && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
          return `"${maybeDate.toISOString().substring(0, 10)}"`;
        }
        if (val === null || val === undefined) {
          return '""';
        }
        const strVal = val.toString().replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',');
    });

    const csvContent = [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `farmers_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenManagePayments = (techSummary) => {
    setManageTech(techSummary);
    setManageTechFarmers(
      techSummary.completedFarmers.map((f) => ({
        ...f,
        paymentGivenToSubcontractor: f.paymentGivenToSubcontractor || '',
        paymentPending: f.paymentPending || '',
      }))
    );
    setShowManagePaymentsModal(true);
  };

  const handleManagePaymentChange = (farmerId, field, newVal) => {
    setManageTechFarmers((prev) =>
      prev.map((f) => (f._id === farmerId ? { ...f, [field]: newVal } : f))
    );
  };

  const handleSaveManagePayments = async () => {
    try {
      for (let f of manageTechFarmers) {
        const original = farmers.find((orig) => orig._id === f._id);
        if (!original) continue;
        const newGiven = parseFloat(f.paymentGivenToSubcontractor) || 0;
        const newPending = parseFloat(f.paymentPending) || 0;
        const origGiven = parseFloat(original.paymentGivenToSubcontractor) || 0;
        const origPending = parseFloat(original.paymentPending) || 0;
        if (newGiven !== origGiven || newPending !== origPending) {
          await axios.put(
            `${API_URL}/api/farmers/${f._id}`,
            {
              paymentGivenToSubcontractor: String(newGiven),
              paymentPending: String(newPending),
            },
            auth
          );
        }
      }
      setToast({ show: true, variant: 'success', message: 'Payments updated successfully' });
      setShowManagePaymentsModal(false);
      await fetchFarmers();
    } catch (err) {
      console.error('Failed to save payments:', err);
      setToast({ show: true, variant: 'danger', message: 'Failed to save payments' });
    }
  };

  const handleRequestAction = async (requestId, action, remarks = '') => {
    try {
      await axios.put(
        `${API_URL}/api/requests/${requestId}`,
        { status: action, remarks },
        auth
      );
      setToast({
        show: true,
        variant: 'success',
        message: `Request ${action.toLowerCase()} successfully`,
      });
      await fetchRequests();
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} request:`, error);
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to ${action.toLowerCase()} request`,
      });
    }
  };

  // Filter and Pagination Logic
  const safeFarmers = Array.isArray(farmers) ? farmers : [];
  const uniqueSurveyors = [...new Set(technicians.map((t) => t.username).filter(Boolean))].sort();
  const uniqueVendors = [...new Set(safeFarmers.map((f) => f.assignedVendorCompanyName).filter(Boolean))].sort();
  const filteredSchemes = schemeGroupFilter ? SCHEMES.filter((s) => s.includes(schemeGroupFilter)) : SCHEMES;

  const delayedInstallations = safeFarmers.filter((f) => isPendingTooLong(f)).length;

  const districtOptions = divisionFilter
    ? MAHARASHTRA_DIVISIONS.find((div) => div.name === divisionFilter)?.districts.map((d) => d.name).sort() || []
    : allDistricts;

  const talukaOptions = districtFilter
    ? allTalukas(districtFilter)
    : MAHARASHTRA_DIVISIONS.flatMap((div) => div.districts.flatMap((d) => d.talukas)).sort();

  let filtered = safeFarmers.filter((f) => {
    const matchesSearch =
      !searchName ||
      f.beneficiaryName?.toLowerCase().includes(searchName.toLowerCase()) ||
      f.beneficiaryId?.toLowerCase().includes(searchName.toLowerCase()) ||
      f.aadharNo?.toLowerCase().includes(searchName.toLowerCase());
    const matchesDistrict = !districtFilter || f.district === districtFilter;
    const matchesDivision = !divisionFilter || f.divisionName === divisionFilter;
    const matchesTaluka = !talukaFilter || f.taluka === talukaFilter;
    const matchesSurveyor = !surveyorFilter || f.surveyorName === surveyorFilter;
    const matchesVendor = !vendorFilter || f.assignedVendorCompanyName === vendorFilter;
    const matchesJSR = !jsrFilter || (jsrFilter === 'Yes' ? f.jsrDeviationYesNo === 'Yes' : f.jsrDeviationYesNo !== 'Yes');
    const matchesAppStatus = !applicationFilter || f.applicationStatus === applicationFilter;
    const matchesInsp = !inspectionFilter || f.inspectionStatus === inspectionFilter;
    const matchesInspFinal = !inspectionStatusFinalFilter || f.inspectionStatusFinal === inspectionStatusFinalFilter;
    const matchesSchemeGroup = !schemeGroupFilter || (f.scheme && f.scheme.includes(schemeGroupFilter));
    const matchesScheme = !schemeFilter || f.scheme === schemeFilter;
    return (
      matchesSearch &&
      matchesDistrict &&
      matchesDivision &&
      matchesTaluka &&
      matchesSurveyor &&
      matchesVendor &&
      matchesJSR &&
      matchesAppStatus &&
      matchesInsp &&
      matchesInspFinal &&
      matchesSchemeGroup &&
      matchesScheme
    );
  });

  if (showDelayedOnly) {
    filtered = filtered.filter((f) => isPendingTooLong(f));
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Tab-specific data
  const installationRecords = safeFarmers.filter(
    (f) =>
      f.inspectionStatus === 'Completed' &&
      ['Pending Installation', 'Move to Installation', 'Ordered', 'Dispatch Completed', 'Ready for Installation'].includes(
        f.applicationStatus
      )
  );
  const completedRecords = safeFarmers.filter((f) =>
    ['Installation Completed', 'Closed'].includes(f.applicationStatus)
  );
  const complaintRecords = safeFarmers.filter((f) => f.applicationStatus === 'Complaint Raised');

  const matchesQuickSearch = (f, term) => {
    const q = term.trim().toLowerCase();
    if (!q) return true;
    return [f.beneficiaryName, f.beneficiaryId, f.mobile, f.district, f.taluka, f.village, f.surveyorName, f.applicationStatus]
      .some((value) => String(value || '').toLowerCase().includes(q));
  };
  const matchesOpsFilters = (f) => (!opsDistrictFilter || f.district === opsDistrictFilter) && (!opsSurveyorFilter || f.surveyorName === opsSurveyorFilter) && (!opsStatusFilter || f.applicationStatus === opsStatusFilter);
  const visibleInstallationRecords = installationRecords.filter((f) => matchesQuickSearch(f, installationSearch) && matchesOpsFilters(f));
  const visibleCompletedRecords = completedRecords.filter((f) => matchesQuickSearch(f, completedSearch) && matchesOpsFilters(f));
  const visibleComplaintRecords = complaintRecords.filter((f) => matchesQuickSearch(f, complaintSearch) && matchesOpsFilters(f));
  const visibleUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    const searchMatch = !q || [u.username, u.mobile, u.role].some((v) => String(v || '').toLowerCase().includes(q));
    const statusMatch = !userStatusFilter || (userStatusFilter === 'active' ? u.isActive !== false : u.isActive === false);
    return searchMatch && (!userRoleFilter || u.role === userRoleFilter) && statusMatch;
  });

  // ─── TECHNICIAN SUMMARY CALCULATION ─────────────────────────────────────────
  const technicianSummary = technicians.map((tech) => {
    const usernameLower = tech.username.toLowerCase();
    const completedByTech = safeFarmers.filter((f) => {
      const assignedToThisTech =
        (f.surveyorName || '').toLowerCase() === usernameLower ||
        (f.reworkAssignTechnician || '').toLowerCase() === usernameLower;
      const isDoneStatus = f.applicationStatus === 'Installation Completed' || f.applicationStatus === 'Closed';
      return assignedToThisTech && isDoneStatus;
    });

    const pendingComplaints = safeFarmers.filter(
      (f) =>
        f.applicationStatus === 'Complaint Raised' &&
        ((f.reworkAssignTechnician || f.surveyorName) || '').toLowerCase() === usernameLower &&
        !f.solutionDate
    ).length;

    const totalPaymentGiven = completedByTech.reduce(
      (sum, f) => sum + (parseFloat(f.paymentGivenToSubcontractor) || 0),
      0
    );
    const totalPaymentPending = completedByTech.reduce(
      (sum, f) => sum + (parseFloat(f.paymentPending) || 0),
      0
    );

    const monthMap = {};
    completedByTech.forEach((f) => {
      const dt = f.installationCompletionDate
        ? new Date(f.installationCompletionDate)
        : new Date(f.updatedAt || f.createdAt);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      if (!monthMap[key]) {
        monthMap[key] = { count: 0, paymentGivenSum: 0, paymentPendingSum: 0 };
      }
      monthMap[key].count += 1;
      monthMap[key].paymentGivenSum += parseFloat(f.paymentGivenToSubcontractor) || 0;
      monthMap[key].paymentPendingSum += parseFloat(f.paymentPending) || 0;
    });

    const monthWise = Object.keys(monthMap)
      .sort()
      .map((m) => ({
        month: m,
        count: monthMap[m].count,
        paymentGivenSum: monthMap[m].paymentGivenSum,
        paymentPendingSum: monthMap[m].paymentPendingSum,
      }));

    return {
      username: tech.username,
      mobile: tech.mobile,
      totalCompleted: completedByTech.length,
      totalComplaints: pendingComplaints,
      totalPaymentGiven,
      totalPaymentPending,
      monthWise,
      completedFarmers: completedByTech,
    };
  });

  const allMonths = [...new Set(technicianSummary.flatMap((t) => t.monthWise.map((mw) => mw.month)))].sort();




  const handleLogout = () => {
    localStorage.clear();
    const platformBase=import.meta.env.VITE_PLATFORM_APP_URL||(import.meta.env.PROD?window.location.origin:`${window.location.protocol}//${window.location.hostname||'localhost'}:5173`); window.location.assign(`${platformBase}/?login=1`);
  };

  const openFarmerDetail = (farmer, event) => {
    if (event?.target?.closest?.('button, input, select, option, a, label, .dropdown-menu')) return;
    setDetailFarmer(farmer);
    setActiveTab('farmer-detail');
  };

  const closeFarmerDetail = () => {
    setDetailFarmer(null);
    setActiveTab('records');
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <Container fluid className="dashboard-superadmin">
      <Toast
        bg={toast.variant}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
        show={toast.show}
        autohide
        delay={3000}
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}
      >
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>

      <div className="dashboard-shell">
        {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
        <AgencySidebar
          role="superadmin"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={isSidebarCollapsed}
          setCollapsed={setIsSidebarCollapsed}
          onLogout={handleLogout}
          onResetSelection={() => { setPage(1); setSelectedFarmers([]); }}
        />

        {/* ─── Main Content ───────────────────────────────────────────────────── */}
        <div className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <AgencyWorkspaceHeader activeTab={activeTab} role="superadmin" />

          {isLoading && (
            <div className="agency-dashboard-skeleton" role="status" aria-live="polite">
              <div className="agency-dashboard-skeleton__kpis"><i/><i/><i/><i/></div>
              <div className="agency-dashboard-skeleton__grid"><i/><i/></div>
              <span>Loading the latest scoped operations…</span>
            </div>
          )}

          {activeTab === 'farmer-detail' && detailFarmer && !isLoading && (
            <FarmerDetailView farmer={detailFarmer} onBack={closeFarmerDetail} />
          )}

          {/* ─── OVERVIEW TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'overview' && !isLoading && <AgencyRmsSummary onOpen={()=>setActiveTab('rms')} />}
          {activeTab === 'overview' && !isLoading && (
            <div className="executive-dashboard">
              <div className="dashboard-commandbar">
                <div><strong>Enterprise operations pulse</strong><span>Portfolio, field execution and governance in one view</span></div>
                <Button variant="outline-secondary" size="sm" onClick={refreshAll} disabled={isLoading}><FaSyncAlt className="me-1" /> Refresh</Button>
              </div>

              <div className="workflow-health">
                <div className="workflow-health__head"><div><strong>Execution health</strong><span>At-a-glance operational progress and exception load</span></div><span>{safeFarmers.length ? Math.round((safeFarmers.filter((f)=>['Installation Completed','Closed'].includes(f.applicationStatus)).length / safeFarmers.length) * 100) : 0}% completed</span></div>
                <div className="workflow-health__grid">
                  <button onClick={()=>setActiveTab('records')}><span>Pending survey / review</span><strong>{safeFarmers.filter((f)=>!f.inspectionStatus || f.inspectionStatus !== 'Completed').length}</strong><small>Needs field or review progress</small></button>
                  <button onClick={()=>setActiveTab('installation')}><span>Installation workload</span><strong>{installationRecords.length}</strong><small>Active installation pipeline</small></button>
                  <button className="is-warning" onClick={()=>{setShowDelayedOnly(true);setActiveTab('records')}}><span>Delayed</span><strong>{delayedInstallations}</strong><small>Past expected hand-off window</small></button>
                  <button className="is-danger" onClick={()=>setActiveTab('complaints')}><span>Open complaints</span><strong>{complaintRecords.length}</strong><small>Requires resolution</small></button>
                  <button className="is-success" onClick={()=>setActiveTab('completed')}><span>Completed / closed</span><strong>{completedRecords.length}</strong><small>Delivered records</small></button>
                </div>
              </div>

              <div className="dashboard-grid dashboard-grid--primary">
                <Card className="panel panel--wide">
                  <Card.Header><div><strong>Application pipeline</strong><span>Current portfolio distribution by operational stage</span></div></Card.Header>
                  <Card.Body><div className="pipeline-list">
                    {APPLICATION_STATUSES.map((status) => { const value=safeFarmers.filter((f)=>f.applicationStatus===status).length; const pct=safeFarmers.length?Math.round((value/safeFarmers.length)*100):0; return value>0 ? <div className="pipeline-row" key={status}><div className="pipeline-row__meta"><span>{status}</span><strong>{value} <small>{pct}%</small></strong></div><div className="pipeline-track"><span style={{width:`${Math.max(pct,value?2:0)}%`}} /></div></div> : null; })}
                  </div></Card.Body>
                </Card>
                <Card className="panel panel--chart">
                  <Card.Header><div><strong>Survey health</strong><span>Inspection completion mix</span></div></Card.Header>
                  <Card.Body className="super-donut-body">
                    <div className="super-donut-wrap"><Pie data={{labels: INSPECTION_STATUSES,datasets:[{data: INSPECTION_STATUSES.map((status)=>safeFarmers.filter((f)=>f.inspectionStatus===status).length),backgroundColor:['#a6535a','#ad813c','#39715a'],borderWidth:0,hoverOffset:3}]}} options={{maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}} /></div>
                    <div className="chart-legend">{INSPECTION_STATUSES.map((status,index)=><div key={status}><span className={`legend-dot legend-dot--${index}`} /><span>{status}</span><strong>{safeFarmers.filter((f)=>f.inspectionStatus===status).length}</strong></div>)}</div>
                  </Card.Body>
                </Card>
              </div>

              <div className="dashboard-grid dashboard-grid--secondary">
                <Card className="panel attention-panel"><Card.Header><div><strong>Management attention</strong><span>Priority queues across operations</span></div></Card.Header><Card.Body><div className="attention-list">
                  <button onClick={()=>setActiveTab('complaints')}><span><FaExclamationTriangle /> Open complaints</span><strong>{safeFarmers.filter((f)=>f.applicationStatus==='Complaint Raised').length}</strong></button>
                  <button onClick={()=>{setShowDelayedOnly(true);setActiveTab('records')}}><span><FaExclamationTriangle /> Delayed installations</span><strong>{delayedInstallations}</strong></button>
                  <button onClick={()=>setActiveTab('requests')}><span><FaFileAlt /> Admin requests</span><strong>{requests.filter((r)=>r.status==='Pending' || !r.status).length}</strong></button>
                </div></Card.Body></Card>
                <Card className="panel quick-nav-panel"><Card.Header><div><strong>Quick access</strong><span>Frequent control-center actions</span></div></Card.Header><Card.Body><div className="quick-nav-grid">
                  <button onClick={()=>setActiveTab('records')}><FaDatabase /><span>Farmer records</span><small>Search & manage</small></button>
                  <button onClick={()=>setActiveTab('users')}><FaUserCog /><span>User access</span><small>Roles & accounts</small></button>
                  <button onClick={()=>setActiveTab('technician-summary')}><FaUsers /><span>Field team</span><small>Performance & payments</small></button>
                </div></Card.Body></Card>
              </div>

              <div className="dashboard-grid dashboard-grid--field"><div className="field-widget"><TechLocationMonitor /></div><div className="field-widget"><TechLocationMap /></div></div>
            </div>
          )}

          {activeTab === 'records' && !isLoading && (
            <Card className="mb-4 farmer-records-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Farmer Records</span>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={refreshAll} disabled={isLoading}>
                    <FaSyncAlt className="me-1" /> Refresh
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={downloadFilteredCSV}>
                    <FaDatabase className="me-1" /> Download CSV
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="records-commandbar">
                  <div className="records-search"><span>⌕</span><Form.Control placeholder="Search farmer, beneficiary ID or Aadhar…" onChange={(e) => debouncedSetSearchName(e.target.value)} /></div>
                  <Button variant="outline-secondary" onClick={() => setFiltersOpen((prev) => !prev)}><FaFilter className="me-1" /> Advanced filters</Button>
                  <div className="records-commandbar__count"><strong>{filtered.length}</strong><span>records</span></div>
                </div>
                <div className="bulk-actionbar">
                  <div className="bulk-actionbar__selection"><strong>{selectedFarmers.length}</strong><span>selected</span></div>
                  <div className="bulk-control"><label>Bulk Update Surveyor</label><div><Form.Select value={bulkSurveyor} onChange={(e)=>setBulkSurveyor(e.target.value)}><option value="">Select surveyor</option>{uniqueSurveyors.map((s)=><option key={s} value={s}>{getTechnicianDisplay(s)}</option>)}</Form.Select><Button onClick={handleBulkSurveyorUpdate} disabled={!selectedFarmers.length || !bulkSurveyor}>Apply</Button></div></div>
                  <div className="bulk-control"><label>Bulk Update Survey Status</label><div><Form.Select value={bulkInspectionStatus} onChange={(e)=>setBulkInspectionStatus(e.target.value)}><option value="">Select status</option><option value="Completed">Completed</option></Form.Select><Button onClick={handleBulkInspectionStatusUpdate} disabled={!selectedFarmers.length || !bulkInspectionStatus}>Apply</Button></div></div>
                  <div className="bulk-control bulk-control--wide"><label>Bulk Update Final Inspection Status</label><div><Form.Select value={bulkInspectionStatusFinal} onChange={(e)=>setBulkInspectionStatusFinal(e.target.value)}><option value="">Select final status</option>{INSPECTION_STATUS_FINAL_VALUES.filter(Boolean).map((status)=><option key={status} value={status}>{status}</option>)}</Form.Select><Button onClick={handleBulkInspectionStatusFinalUpdate} disabled={!selectedFarmers.length || !bulkInspectionStatusFinal}>Apply</Button></div></div>
                </div>

                {filtersOpen && (
                  <>
                    <button className="filter-drawer-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
                    <aside className="filter-drawer" role="dialog" aria-modal="true" aria-label="Record filters">
                      <div className="filter-drawer__header">
                        <div><strong>Filters</strong><span>Refine the record list without losing context</span></div>
                        <button type="button" className="filter-drawer__close" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><FaTimes /></button>
                      </div>
                      <div className="filter-drawer__body">

                    <Row className="filter-row mb-4 gx-3 gy-3">
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="divisionFilter">
                          <Form.Label>Division</Form.Label>
                          <Form.Select
                            value={divisionFilter}
                            onChange={(e) => {
                              setDivisionFilter(e.target.value);
                              setDistrictFilter('');
                              setTalukaFilter('');
                              setPage(1);
                            }}
                          >
                            <option value="">All Divisions</option>
                            {allDivisions.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="districtFilter">
                          <Form.Label>District</Form.Label>
                          <Form.Select
                            value={districtFilter}
                            onChange={(e) => {
                              setDistrictFilter(e.target.value);
                              setTalukaFilter('');
                              setPage(1);
                            }}
                          >
                            <option value="">All Districts</option>
                            {districtOptions.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="talukaFilter">
                          <Form.Label>Taluka</Form.Label>
                          <Form.Select
                            value={talukaFilter}
                            onChange={(e) => {
                              setTalukaFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Talukas</option>
                            {talukaOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="surveyorFilter">
                          <Form.Label>Surveyor</Form.Label>
                          <Form.Select
                            value={surveyorFilter}
                            onChange={(e) => {
                              setSurveyorFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Surveyors</option>
                            {uniqueSurveyors.map((s) => (
                              <option key={s} value={s}>
                                {getTechnicianDisplay(s)}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="vendorFilter">
                          <Form.Label>Vendor</Form.Label>
                          <Form.Select
                            value={vendorFilter}
                            onChange={(e) => {
                              setVendorFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Vendors</option>
                            {uniqueVendors.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="jsrFilter">
                          <Form.Label>JSR</Form.Label>
                          <Form.Select
                            value={jsrFilter}
                            onChange={(e) => {
                              setJsrFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All JSR</option>
                            <option value="JSR OUTCOME ACCEPTED">JSR OUTCOME ACCEPTED</option>
                            <option value="JSR OUTCOME REJECTED">JSR OUTCOME REJECTED</option>
                            <option value="JSR SUBMITTED">JSR SUBMITTED</option>
                            <option value="JSR IN DISCREPANCY">JSR IN DISCREPANCY</option>
                            <option value="VENDOR INFORMATION RECEIVED">VENDOR INFORMATION RECEIVED</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="applicationFilter">
                          <Form.Label>App Status</Form.Label>
                          <Form.Select
                            value={applicationFilter}
                            onChange={(e) => {
                              setApplicationFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Statuses</option>
                            {APPLICATION_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="inspectionFilter">
                          <Form.Label>Survey Status</Form.Label>
                          <Form.Select
                            value={inspectionFilter}
                            onChange={(e) => {
                              setInspectionFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Statuses</option>
                            {INSPECTION_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="inspectionStatusFinalFilter">
                          <Form.Label>Final Inspection Status</Form.Label>
                          <Form.Select
                            value={inspectionStatusFinalFilter}
                            onChange={(e) => {
                              setInspectionStatusFinalFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Statuses</option>
                            {INSPECTION_STATUS_FINAL_VALUES.map((s) => (
                              <option key={s || 'none'} value={s}>
                                {s || 'None'}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="schemeGroupFilter">
                          <Form.Label>Scheme Group</Form.Label>
                          <Form.Select
                            value={schemeGroupFilter}
                            onChange={(e) => {
                              setSchemeGroupFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Groups</option>
                            <option value="MEDA">MEDA</option>
                            <option value="MSEDCL">MSEDCL</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="schemeFilter">
                          <Form.Label>Scheme</Form.Label>
                          <Form.Select
                            value={schemeFilter}
                            onChange={(e) => {
                              setSchemeFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Schemes</option>
                            {filteredSchemes.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xl={3} lg={4} md={6} sm={12}>
                        <Form.Group controlId="delayedOnly" className="d-flex align-items-center" style={{ marginTop: '1.6rem' }}>
                          <Form.Check
                            type="checkbox"
                            label="Delayed Only"
                            checked={showDelayedOnly}
                            onChange={(e) => {
                              setShowDelayedOnly(e.target.checked);
                              setPage(1);
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                      </div>
                      <div className="filter-drawer__footer">
                        <Button variant="primary" onClick={() => setFiltersOpen(false)}>View results</Button>
                      </div>
                    </aside>
                  </>
                )}

                <div className="table-responsive">
                  <Table striped hover className="farmer-table">
                    <thead>
                      <tr>
                        <th className="checkbox-col">
                          <Form.Check
                            type="checkbox"
                            onChange={(e) => setSelectedFarmers(e.target.checked ? paginated.map((f) => f._id) : [])}
                            checked={selectedFarmers.length === paginated.length && paginated.length > 0}
                          />
                        </th>
                        <th className="id-col">ID</th>
                        <th>Name</th>
                        <th>District</th>
                        <th>Vendor</th>
                        <th>Survey</th>
                        <th>Final Inspection</th>
                        <th>Status</th>
                        <th>JSR</th>
                        <th>Surveyor</th>
                        <th className="scheme-col">Scheme</th>
                        <th className="action-col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((f, index) => (
                        <tr
                          key={f._id}
                          onClick={(e) => openFarmerDetail(f, e)}
                          title="Open beneficiary details"
                          className={`farmer-clickable-row ${isPendingTooLong(f) ? 'highlight-pending' : index % 2 === 0 ? 'even-row' : 'odd-row'}`}
                        >
                          <td className="checkbox-col">
                            <Form.Check
                              type="checkbox"
                              value={f._id}
                              checked={selectedFarmers.includes(f._id)}
                              onChange={() => toggleFarmerSelection(f._id)}
                            />
                          </td>
                          <td className="id-col">{f.beneficiaryId}</td>
                          <td>{f.beneficiaryName}</td>
                          <td>{f.district}</td>
                          <td>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip id={`tooltip-vendor-${f._id}`}>{f.assignedVendorCompanyName || '—'}</Tooltip>}
                            >
                              <span className="truncate-text">{f.assignedVendorCompanyName || '—'}</span>
                            </OverlayTrigger>
                          </td>
                          <td>
                            <Badge
                              bg={
                                f.inspectionStatus === 'Completed'
                                  ? 'success'
                                  : f.inspectionStatus === 'In Progress'
                                  ? 'info'
                                  : 'warning'
                              }
                            >
                              {f.inspectionStatus}
                            </Badge>
                          </td>
                          <td>
                            {role !== 'field_technician' ? (
                              <Form.Select
                                size="sm"
                                value={f.inspectionStatusFinal || ''}
                                onChange={(e) => handleInspectionStatusFinalChange(f._id, e.target.value)}
                              >
                                {INSPECTION_STATUS_FINAL_VALUES.map((s) => (
                                  <option key={s || 'none'} value={s}>
                                    {s || 'None'}
                                  </option>
                                ))}
                              </Form.Select>
                            ) : (
                              <OverlayTrigger
                                placement="top"
                                overlay={<Tooltip id={`tooltip-inspection-final-${f._id}`}>{f.inspectionStatusFinal || 'None'}</Tooltip>}
                              >
                                <span className="truncate-text">{f.inspectionStatusFinal || 'None'}</span>
                              </OverlayTrigger>
                            )}
                          </td>
                          <td>
                            {role !== 'field_technician' ? (
                              <Form.Select
                                size="sm"
                                value={f.applicationStatus}
                                onChange={(e) => {
                                  if (e.target.value === 'Ready for Installation') {
                                    setSelectedFarmer(f);
                                    setAssignTechnicianForm({
                                      surveyorName: f.surveyorName || '',
                                      surveyorMobile: f.surveyorMobile || '',
                                    });
                                    setShowAssignTechnicianModal(true);
                                  } else {
                                    handleStatusChange(f._id, e.target.value, f);
                                  }
                                }}
                              >
                                {APPLICATION_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </Form.Select>
                            ) : (
                              <Badge
                                bg={
                                  f.applicationStatus === 'Closed'
                                    ? 'success'
                                    : f.applicationStatus === 'Complaint Raised'
                                    ? 'danger'
                                    : f.applicationStatus === 'Installation Completed'
                                    ? 'success'
                                    : 'info'
                                }
                              >
                                {f.applicationStatus}
                              </Badge>
                            )}
                          </td>
                          <td>
                            {role !== 'field_technician' ? (
                              <Form.Select
                                size="sm"
                                value={f.jsrDeviationYesNo || ''}
                                onChange={(e) => handleJSRChange(f._id, e.target.value)}
                              >
                                <option value="">NO</option>
                                <option value="JSR OUTCOME ACCEPTED">JSR OUTCOME ACCEPTED</option>
                                <option value="JSR OUTCOME REJECTED">JSR OUTCOME REJECTED</option>
                                <option value="JSR SUBMITTED">JSR SUBMITTED</option>
                                <option value="JSR IN DISCREPANCY">JSR IN DISCREPANCY</option>
                                <option value="VENDOR INFORMATION RECEIVED">VENDOR INFORMATION RECEIVED</option>
                              </Form.Select>
                            ) : (
                              <Badge bg={f.jsrDeviationYesNo === 'Yes' ? 'success' : 'danger'}>
                                {f.jsrDeviationYesNo || 'Pending'}
                              </Badge>
                            )}
                          </td>
                          <td>{getTechnicianDisplay(f.surveyorName)}</td>
                          <td className="scheme-col">
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip id={`tooltip-scheme-${f._id}`}>{f.scheme || '—'}</Tooltip>}
                            >
                              <span className="truncate-text">{f.scheme || '—'}</span>
                            </OverlayTrigger>
                          </td>
                          <td className="action-col">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => {
                                console.log('Opening EditFarmerModal for farmer:', f);
                                setSelectedFarmer(f);
                                setShowEdit(true);
                              }}
                            >
                              <FaEdit className="me-1" /> Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={async () => {
                                const reason = window.prompt('Please provide a reason for deletion:');
                                if (!reason?.trim()) {
                                  setToast({ show: true, variant: 'warning', message: 'Deletion cancelled: Reason required' });
                                  return;
                                }
                                if (!window.confirm('Delete this beneficiary record? This action is audited.')) return;
                                try {
                                  await axios.delete(`${API_URL}/api/farmers/${f._id}`, { ...auth, data: { reason: reason.trim() } });
                                  await refreshAll();
                                  setToast({
                                    show: true,
                                    variant: 'success',
                                    message: 'Farmer deleted successfully',
                                  });
                                } catch (error) {
                                  console.error('Failed to delete farmer:', error);
                                  setToast({
                                    show: true,
                                    variant: 'danger',
                                    message: `Failed to delete farmer: ${error.response?.data?.message || error.message}`,
                                  });
                                }
                              }}
                            >
                              <FaTrash className="me-1" /> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                <div className="records-footer">
                  <div className="records-footer__summary">
                    Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> records
                  </div>
                  <div className="records-footer__controls">
                    <Form.Select
                      size="sm"
                      className="page-size-select"
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
                      aria-label="Rows per page"
                    >
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </Form.Select>
                    <Button variant="outline-secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    <span className="records-footer__page">Page {page} of {Math.max(totalPages, 1)}</span>
                    <Button variant="outline-secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* ─── INSTALLATION ORDERS TAB ─────────────────────────────────────── */}
          {activeTab === 'installation' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Installation Orders</span>
                <Button variant="outline-secondary" size="sm" onClick={refreshAll} disabled={isLoading}>
                  <FaSyncAlt className="me-1" /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="workspace-toolbar"><div className="workspace-search"><span>⌕</span><Form.Control value={installationSearch} onChange={(e)=>setInstallationSearch(e.target.value)} placeholder="Search name, ID, mobile, district, surveyor…" /></div><Button variant="outline-secondary" onClick={()=>setOpsFiltersOpen('installation')}><FaFilter className="me-1" /> Filters</Button><div className="workspace-toolbar__meta"><strong>{visibleInstallationRecords.length}</strong><span>orders</span></div></div>
                {visibleInstallationRecords.length === 0 ? (
                  <p>No verified farmer records ready for order placement.</p>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover className="table">
                      <thead className="table-dark">
                        <tr>
                          <th>Name</th>
                          <th>Mobile</th>
                          <th>Dispatch Date</th>
                          <th>Material Received</th>
                          <th>Order Received Date</th>
                          <th>App Status</th>
                          <th>Surveyor</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleInstallationRecords.map((r) => (
                          <tr key={r._id} className={isPendingTooLong(r) ? 'highlight-pending' : ''}>
                            <td>{r.beneficiaryName}</td>
                            <td>{r.mobile}</td>
                            <td>
                              {r.materialDispatchDate ? new Date(r.materialDispatchDate).toISOString().slice(0, 10) : '—'}
                            </td>
                            <td>
                              <Badge bg={r.materialReceivedConfirmationYesNo === 'Yes' ? 'success' : 'danger'}>
                                {r.materialReceivedConfirmationYesNo || 'Pending'}
                              </Badge>
                            </td>
                            <td>{r.orderReceivedDate ? new Date(r.orderReceivedDate).toISOString().slice(0, 10) : '—'}</td>
                            <td>
                              <Badge
                                bg={
                                  r.applicationStatus === 'Closed'
                                    ? 'success'
                                    : r.applicationStatus === 'Complaint Raised'
                                    ? 'danger'
                                    : r.applicationStatus === 'Installation Completed'
                                    ? 'success'
                                    : r.applicationStatus === 'Dispatch Completed'
                                    ? 'info'
                                    : r.applicationStatus === 'Ready for Installation'
                                    ? 'warning'
                                    : 'info'
                                }
                              >
                                {r.applicationStatus}
                              </Badge>
                            </td>
                            <td>{getTechnicianDisplay(r.surveyorName)}</td>
                            <td>
                              {r.applicationStatus === 'Move to Installation' && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => {
                                    if (!showOrder) {
                                      setOrderFarmer(r);
                                      setShowOrder(true);
                                    }
                                  }}
                                >
                                  Place Order
                                </Button>
                              )}
                              {r.applicationStatus === 'Dispatch Completed' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    if (!showAssignTechnicianModal) {
                                      setSelectedFarmer(r);
                                      setAssignTechnicianForm({
                                        surveyorName: r.surveyorName || '',
                                        surveyorMobile: r.surveyorMobile || '',
                                      });
                                      setShowAssignTechnicianModal(true);
                                    }
                                  }}
                                >
                                  Mark Ready for Installation
                                </Button>
                              )}
                              {(r.applicationStatus === 'Ordered' || r.applicationStatus === 'Ready for Installation') && (
                                <Button
                                  size="sm"
                                  variant="warning"
                                  onClick={() => {
                                    if (!showAssignTechnicianModal) {
                                      setSelectedFarmer(r);
                                      setAssignTechnicianForm({
                                        surveyorName: r.surveyorName || '',
                                        surveyorMobile: r.surveyorMobile || '',
                                      });
                                      setShowAssignTechnicianModal(true);
                                    }
                                  }}
                                >
                                  Reassign Technician
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* ─── COMPLETED INSTALLS TAB ───────────────────────────────────────── */}
          {activeTab === 'completed' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Completed Installs</span>
                <Button variant="outline-secondary" size="sm" onClick={refreshAll} disabled={isLoading}>
                  <FaSyncAlt className="me-1" /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="workspace-toolbar"><div className="workspace-search"><span>⌕</span><Form.Control value={completedSearch} onChange={(e)=>setCompletedSearch(e.target.value)} placeholder="Search completed records…" /></div><Button variant="outline-secondary" onClick={()=>setOpsFiltersOpen('completed')}><FaFilter className="me-1" /> Filters</Button><div className="workspace-toolbar__meta"><strong>{visibleCompletedRecords.length}</strong><span>completed</span></div></div>
                {visibleCompletedRecords.length === 0 ? (
                  <p>No installations completed yet.</p>
                ) : (
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Surveyor</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCompletedRecords.map((farmer) => (
                        <tr key={farmer._id}>
                          <td>{farmer.beneficiaryName}</td>
                          <td>
                            <Badge bg={farmer.applicationStatus === 'Closed' ? 'success' : 'info'}>
                              {farmer.applicationStatus}
                            </Badge>
                          </td>
                          <td>
                            {farmer.surveyorName && farmer.surveyorMobile
                              ? `${farmer.surveyorName} (${farmer.surveyorMobile})`
                              : '—'}
                          </td>
                          <td>
                            {farmer.applicationStatus === 'Closed' ? (
                              <span>Closed</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  if (!showPaymentModal) {
                                    setSelectedFarmer(farmer);
                                    setPaymentForm({
                                      beneficiaryId: farmer.beneficiaryId || '',
                                      beneficiaryName: farmer.beneficiaryName || '',
                                      district: farmer.district || '',
                                      taluka: farmer.taluka || '',
                                      village: farmer.village || '',
                                      mobile: farmer.mobile || '',
                                      aadharNo: farmer.aadharNo || '',
                                      pumpType: farmer.pumpType || '',
                                      pumpHP: farmer.pumpHP || '',
                                      controllerTypeWithOrWithout: farmer.controllerTypeWithOrWithout || '',
                                      siteLocation: farmer.siteLocation || '',
                                      siteDepth: farmer.siteDepth || '',
                                      actualHeadM: farmer.actualHeadM || '',
                                      surveyDate: farmer.surveyDate
                                        ? new Date(farmer.surveyDate).toISOString().slice(0,10)
                                        : '',
                                      surveyorName: farmer.surveyorName || '',
                                      surveyorMobile: farmer.surveyorMobile || '',
                                      inspectionStatus: farmer.inspectionStatus || '',
                                      jsrDeviationYesNo: farmer.jsrDeviationYesNo || '',
                                      inspectionStatusFinal: farmer.inspectionStatusFinal || '',
                                      deviationRemarks: farmer.deviationRemarks || '',
                                      pumpNoUnique: farmer.pumpNoUnique || '',
                                      motorNoUnique: farmer.motorNoUnique || '',
                                      controllerNoUnique: farmer.controllerNoUnique || '',
                                      imeiNoUnique: farmer.imeiNoUnique || '',
                                      panels: Array.isArray(farmer.panels) ? farmer.panels : [],
                                      installationDoneYesNo: farmer.installationDoneYesNo || '',
                                      pumpNotOperatingYesNo: farmer.pumpNotOperatingYesNo || '',
                                      companyAssignedPersonName: farmer.companyAssignedPersonName || '',
                                      chargesToDebit: farmer.chargesToDebit || '',
                                      subcontractorRate: farmer.subcontractorRate || '',
                                      subcontractorBill: farmer.subcontractorBill || '',
                                      paymentGivenToSubcontractor: farmer.paymentGivenToSubcontractor || '',
                                      paymentPending: farmer.paymentPending || '',
                                      farmerPhoto: farmer.farmerPhoto || '',
                                      farmerSignature: farmer.farmerSignature || '',
                                      sitePhotos: Array.isArray(farmer.sitePhotos) ? farmer.sitePhotos.join(',') : farmer.sitePhotos || '',
                                    });
                                    setShowPaymentModal(true);
                                  }
                                }}
                              >
                                Close Record
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          )}

          {/* ─── COMPLAINTS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'complaints' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Complaints</span>
                <Button variant="outline-secondary" size="sm" onClick={refreshAll} disabled={isLoading}>
                  <FaSyncAlt className="me-1" /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="workspace-toolbar"><div className="workspace-search"><span>⌕</span><Form.Control value={complaintSearch} onChange={(e)=>setComplaintSearch(e.target.value)} placeholder="Search complaints by farmer, ID, location or technician…" /></div><Button variant="outline-secondary" onClick={()=>setOpsFiltersOpen('complaints')}><FaFilter className="me-1" /> Filters</Button><div className="workspace-toolbar__meta workspace-toolbar__meta--alert"><strong>{visibleComplaintRecords.length}</strong><span>open</span></div></div>
                {visibleComplaintRecords.length === 0 ? (
                  <p>No complaints at this time.</p>
                ) : (
                  <Accordion defaultActiveKey={null}>
                    {visibleComplaintRecords.map((farmer) => (
                      <Accordion.Item key={farmer._id} eventKey={farmer._id}>
                        <Accordion.Header>
                          {farmer.beneficiaryName} - {farmer.beneficiaryId}
                          {isPendingTooLong(farmer) && (
                            <Badge bg="danger" className="ms-2">
                              Delayed
                            </Badge>
                          )}
                        </Accordion.Header>
                        <Accordion.Body>
                          <Row>
                            <Col md={6}>
                              <p>
                                <strong>Mobile:</strong> {farmer.mobile}
                              </p>
                              <p>
                                <strong>District:</strong> {farmer.district}
                              </p>
                              <p>
                                <strong>Surveyor:</strong> {getTechnicianDisplay(farmer.surveyorName)}
                              </p>
                              <p>
                                <strong>Inspection Status:</strong> {farmer.inspectionStatus}
                              </p>
                              <p>
                                <strong>Final Inspection Status:</strong> {farmer.inspectionStatusFinal || 'None'}
                              </p>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>ReWork</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={reworkData[farmer._id]?.reWork || ''}
                                  onChange={(e) => updateReworkData(farmer._id, 'reWork', e.target.value)}
                                />
                              </Form.Group>
                              <Form.Group className="mb-3">
                                <Form.Label>Issues</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={reworkData[farmer._id]?.issues || ''}
                                  onChange={(e) => updateReworkData(farmer._id, 'issues', e.target.value)}
                                />
                              </Form.Group>
                              <Form.Group className="mb-3">
                                <Form.Label>Assign Technician</Form.Label>
                                <Form.Select
                                  value={reworkData[farmer._id]?.reworkAssignTechnician || ''}
                                  onChange={(e) => updateReworkData(farmer._id, 'reworkAssignTechnician', e.target.value)}
                                >
                                  <option value="">Select Technician</option>
                                  {technicians.map((t) => (
                                    <option key={t._id} value={t.username}>
                                      {t.username} ({t.mobile})
                                    </option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                              <Form.Group className="mb-3">
                                <Form.Label>Solution Date</Form.Label>
                                <Form.Control
                                  type="date"
                                  value={reworkData[farmer._id]?.solutionDate || ''}
                                  onChange={(e) => updateReworkData(farmer._id, 'solutionDate', e.target.value)}
                                />
                              </Form.Group>
                              <Button
                                variant="primary"
                                onClick={() => handleReworkSubmit(farmer._id)}
                              >
                                Save Complaint Details
                              </Button>
                            </Col>
                          </Row>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                )}
              </Card.Body>
            </Card>
          )}

          {/* ─── TECHNICIAN SUMMARY TAB ─────────────────────────────────────── */}
          {activeTab === 'material-receipts' && !isLoading && (<MaterialReceiptsPanel />)}
          {activeTab === 'rms' && !isLoading && (<AgencyRmsPanel />)}
          {activeTab === 'reports' && !isLoading && (<AgencyReportsPanel />)}

          {activeTab === 'technician-summary' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Technician Summary</span>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => setFiltersOpen(true)}><FaFilter className="me-1" /> Filters{monthFilter ? ' · 1' : ''}</Button>
                  <Button variant="outline-secondary" size="sm" onClick={refreshAll} disabled={isLoading}>
                    <FaSyncAlt className="me-1" /> Refresh
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {filtersOpen && (
                  <>
                    <button className="filter-drawer-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
                    <aside className="filter-drawer" role="dialog" aria-modal="true" aria-label="Technician filters">
                      <div className="filter-drawer__header"><div><strong>Technician filters</strong><span>Refine performance data</span></div><button type="button" className="filter-drawer__close" onClick={() => setFiltersOpen(false)}><FaTimes /></button></div>
                      <div className="filter-drawer__body"><Form.Group controlId="monthFilter"><Form.Label>Month</Form.Label><Form.Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}><option value="">All Months</option>{allMonths.map((m) => <option key={m} value={m}>{m}</option>)}</Form.Select></Form.Group></div>
                      <div className="filter-drawer__footer"><Button variant="primary" onClick={() => setFiltersOpen(false)}>View results</Button></div>
                    </aside>
                  </>
                )}
                {technicianSummary.length === 0 ? (
                  <p>No technician data available.</p>
                ) : (
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Technician</th>
                        <th>Mobile</th>
                        <th>Completed Installs</th>
                        <th>Pending Complaints</th>
                        <th>Total Payment Given</th>
                        <th>Total Payment Pending</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {technicianSummary
                        .filter((t) => {
                          if (!monthFilter) return true;
                          return t.monthWise.some((mw) => mw.month === monthFilter);
                        })
                        .map((tech) => (
                          <tr key={tech.username}>
                            <td>{tech.username}</td>
                            <td>{tech.mobile}</td>
                            <td>
                              {monthFilter
                                ? tech.monthWise.find((mw) => mw.month === monthFilter)?.count || 0
                                : tech.totalCompleted}
                            </td>
                            <td>{tech.totalComplaints}</td>
                            <td>
                              ₹
                              {monthFilter
                                ? tech.monthWise.find((mw) => mw.month === monthFilter)?.paymentGivenSum.toFixed(2) || 0
                                : tech.totalPaymentGiven.toFixed(2)}
                            </td>
                            <td>
                              ₹
                              {monthFilter
                                ? tech.monthWise.find((mw) => mw.month === monthFilter)?.paymentPendingSum.toFixed(2) || 0
                                : tech.totalPaymentPending.toFixed(2)}
                            </td>
                            <td>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleOpenManagePayments(tech)}
                              >
                                Manage Payments
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          )}

          {/* ─── USER MANAGEMENT TAB ─────────────────────────────────────────── */}
          {activeTab === 'users' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>User Management</span>
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={openNewUserModal}
                  >
                    <FaPlus className="me-1" /> Add User
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={refreshAll} disabled={isLoading}>
                    <FaSyncAlt className="me-1" /> Refresh
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="user-governance-strip">
                  <div><span>Total users</span><strong>{users.length}</strong></div>
                  <div><span>Admins</span><strong>{users.filter((u)=>u.role === 'admin').length}</strong></div>
                  <div><span>Technicians</span><strong>{users.filter((u)=>u.role === 'field_technician').length}</strong></div>
                  <div><span>Location available</span><strong>{users.filter((u)=>u.lastLocation?.latitude != null).length}</strong></div>
                </div>
                <div className="workspace-toolbar"><div className="workspace-search"><span>⌕</span><Form.Control value={userSearch} onChange={(e)=>setUserSearch(e.target.value)} placeholder="Search users by name, mobile or role…" /></div><Form.Select className="workspace-role-filter" value={userRoleFilter} onChange={(e)=>setUserRoleFilter(e.target.value)}><option value="">All roles</option><option value="superadmin">Superadmin</option><option value="admin">Admin</option><option value="field_technician">Technician</option></Form.Select><Form.Select className="workspace-role-filter" value={userStatusFilter} onChange={(e)=>setUserStatusFilter(e.target.value)}><option value="">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></Form.Select><div className="workspace-toolbar__meta"><strong>{visibleUsers.length}</strong><span>users</span></div></div>
                {visibleUsers.length === 0 ? (
                  <p>No users found.</p>
                ) : (
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Username</th>
                        <th>Mobile</th>
                        <th>Role</th>
                        <th>Account status</th>
                        <th>Last known location</th>
                        <th>Last seen</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleUsers.map((user) => (
                        <tr key={user._id}>
                          <td>{user.username}</td>
                          <td>{user.mobile}</td>
                          <td><Badge bg="secondary">{user.role === 'field_technician' ? 'Technician' : user.role}</Badge></td>
                          <td><span className={`account-state ${user.isActive === false ? 'is-inactive' : 'is-active'}`}>{user.isActive === false ? 'Inactive' : 'Active'}</span></td>
                          <td className="user-location-cell">{user.lastLocation?.latitude != null ? <><strong>{user.lastLocation.address || `${Number(user.lastLocation.latitude).toFixed(4)}, ${Number(user.lastLocation.longitude).toFixed(4)}`}</strong><span>{user.lastLocation.accuracy ? `Accuracy ±${Math.round(user.lastLocation.accuracy)}m` : 'Location captured'}</span><button type="button" className="location-map-link" onClick={()=>window.open(`https://www.google.com/maps?q=${user.lastLocation.latitude},${user.lastLocation.longitude}`, '_blank', 'noopener,noreferrer')}>Open map</button></> : <span className="location-unavailable">Not available yet</span>}</td>
                          <td>{user.lastLocation?.capturedAt || user.lastLocation?.updatedAt ? new Date(user.lastLocation.capturedAt || user.lastLocation.updatedAt).toLocaleString() : '—'}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => openEditUserModal(user)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => deleteUser(user._id)}
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          )}

          {/* ─── ADMIN REQUESTS TAB ──────────────────────────────────────────── */}
          {activeTab === 'requests' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Admin Requests</span>
                <Button variant="outline-secondary" size="sm" onClick={refreshAll} disabled={isLoading}>
                  <FaSyncAlt className="me-1" /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                {error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : requests.length === 0 ? (
                  <p>No requests found.</p>
                ) : (
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th>Request ID</th>
                        <th>Farmer ID</th>
                        <th>Requested By</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr key={req._id}>
                          <td>{req._id}</td>
                          <td>{req.farmerId}</td>
                          <td>{req.requestedBy}</td>
                          <td>
                            <Badge
                              bg={
                                req.status === 'Approved'
                                  ? 'success'
                                  : req.status === 'Rejected'
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {req.status}
                            </Badge>
                          </td>
                          <td>
                            {req.status === 'Pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  className="me-1"
                                  onClick={() => handleApproveRequest(req._id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleRejectRequest(req._id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          )}

          {opsFiltersOpen && (
            <>
              <button className="filter-drawer-backdrop" aria-label="Close filters" onClick={()=>setOpsFiltersOpen('')} />
              <aside className="filter-drawer" role="dialog" aria-modal="true" aria-label="Workspace filters">
                <div className="filter-drawer__header"><div><strong>{opsFiltersOpen === 'installation' ? 'Installation filters' : opsFiltersOpen === 'completed' ? 'Completed filters' : 'Complaint filters'}</strong><span>Refine this workspace without hiding primary actions</span></div><button className="filter-drawer__close" onClick={()=>setOpsFiltersOpen('')}><FaTimes /></button></div>
                <div className="filter-drawer__body">
                  <Form.Group className="mb-3"><Form.Label>District</Form.Label><Form.Select value={opsDistrictFilter} onChange={(e)=>setOpsDistrictFilter(e.target.value)}><option value="">All districts</option>{allDistricts.map((d)=><option key={d} value={d}>{d}</option>)}</Form.Select></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Technician / surveyor</Form.Label><Form.Select value={opsSurveyorFilter} onChange={(e)=>setOpsSurveyorFilter(e.target.value)}><option value="">All technicians</option>{uniqueSurveyors.map((u)=><option key={u} value={u}>{getTechnicianDisplay(u)}</option>)}</Form.Select></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Application status</Form.Label><Form.Select value={opsStatusFilter} onChange={(e)=>setOpsStatusFilter(e.target.value)}><option value="">All statuses</option>{APPLICATION_STATUSES.map((status)=><option key={status} value={status}>{status}</option>)}</Form.Select></Form.Group>
                </div>
                <div className="filter-drawer__footer"><Button variant="outline-secondary" className="me-2" onClick={()=>{setOpsDistrictFilter('');setOpsSurveyorFilter('');setOpsStatusFilter('')}}>Reset</Button><Button variant="primary" onClick={()=>setOpsFiltersOpen('')}>View results</Button></div>
              </aside>
            </>
          )}

          {/* ─── MODALS ───────────────────────────────────────────────────────── */}
          <EditFarmerModal
            show={showEdit}
            onHide={() => {
              setShowEdit(false);
              setSelectedFarmer(null);
            }}
            farmer={selectedFarmer}
            onSave={async (updatedFarmer) => {
              try {
                await axios.put(`${API_URL}/api/farmers/${selectedFarmer._id}`, updatedFarmer, auth);
                await fetchFarmers();
                setShowEdit(false);
                setSelectedFarmer(null);
                setToast({ show: true, variant: 'success', message: 'Farmer updated successfully' });
              } catch (error) {
                console.error('Failed to update farmer:', error);
                setToast({ show: true, variant: 'danger', message: 'Failed to update farmer' });
              }
            }}
          />

          <OrderPlacementModal
            show={showOrder}
            onHide={() => {
              setShowOrder(false);
              setOrderFarmer(null);
            }}
            farmer={orderFarmer}
            onSave={async () => {
              await fetchFarmers();
              setShowOrder(false);
              setOrderFarmer(null);
              setToast({ show: true, variant: 'success', message: 'Order placed successfully' });
            }}
          />

          <Modal show={showAssignTechnicianModal} onHide={() => setShowAssignTechnicianModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Assign Technician</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group controlId="assignTechnician" className="mb-3">
                  <Form.Label>Technician</Form.Label>
                  <Form.Select
                    value={assignTechnicianForm.surveyorName}
                    onChange={handleAssignTechnicianChange}
                  >
                    <option value="">Select Technician</option>
                    {technicians.map((t) => (
                      <option key={t._id} value={t.username}>
                        {getTechnicianDisplay(t.username)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAssignTechnicianModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleStatusChange(selectedFarmer._id, 'Ready for Installation', selectedFarmer)}
                disabled={!assignTechnicianForm.surveyorName}
              >
                Save
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Close Farmer Record</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handlePaymentSubmit}>
                <Row className="gy-3">
                  <Col md={6}>
                    <Form.Group controlId="beneficiaryId">
                      <Form.Label>Beneficiary ID</Form.Label>
                      <Form.Control value={paymentForm.beneficiaryId} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="beneficiaryName">
                      <Form.Label>Name</Form.Label>
                      <Form.Control value={paymentForm.beneficiaryName} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="district">
                      <Form.Label>District</Form.Label>
                      <Form.Control value={paymentForm.district} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="taluka">
                      <Form.Label>Taluka</Form.Label>
                      <Form.Control value={paymentForm.taluka} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="village">
                      <Form.Label>Village</Form.Label>
                      <Form.Control value={paymentForm.village} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="mobile">
                      <Form.Label>Mobile</Form.Label>
                      <Form.Control value={paymentForm.mobile} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="aadharNo">
                      <Form.Label>Aadhar No</Form.Label>
                      <Form.Control value={paymentForm.aadharNo} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="pumpType">
                      <Form.Label>Pump Type</Form.Label>
                      <Form.Control value={paymentForm.pumpType} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="pumpHP">
                      <Form.Label>Pump HP</Form.Label>
                      <Form.Control value={paymentForm.pumpHP} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="controllerType">
                      <Form.Label>Controller Type</Form.Label>
                      <Form.Control value={paymentForm.controllerTypeWithOrWithout} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="siteLocation">
                      <Form.Label>Site Location</Form.Label>
                      <Form.Control value={paymentForm.siteLocation} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="siteDepth">
                      <Form.Label>Site Depth</Form.Label>
                      <Form.Control value={paymentForm.siteDepth} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="actualHeadM">
                      <Form.Label>Actual Head (m)</Form.Label>
                      <Form.Control value={paymentForm.actualHeadM} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="surveyDate">
                      <Form.Label>Survey Date</Form.Label>
                      <Form.Control value={paymentForm.surveyDate} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="surveyorName">
                      <Form.Label>Surveyor</Form.Label>
                      <Form.Select
                        value={paymentForm.surveyorName}
                        onChange={handleTechnicianChange}
                      >
                        <option value="">Select Technician</option>
                        {technicians.map((t) => (
                          <option key={t._id} value={t.username}>
                            {getTechnicianDisplay(t.username)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="inspectionStatus">
                      <Form.Label>Inspection Status</Form.Label>
                      <Form.Control value={paymentForm.inspectionStatus} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="jsrDeviationYesNo">
                      <Form.Label>JSR Deviation</Form.Label>
                      <Form.Control value={paymentForm.jsrDeviationYesNo} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group controlId="deviationRemarks">
                      <Form.Label>Deviation Remarks</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={paymentForm.deviationRemarks}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="pumpNoUnique">
                      <Form.Label>Pump No</Form.Label>
                      <Form.Control
                        value={paymentForm.pumpNoUnique}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, pumpNoUnique: e.target.value }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="motorNoUnique">
                      <Form.Label>Motor No</Form.Label>
                      <Form.Control
                        value={paymentForm.motorNoUnique}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, motorNoUnique: e.target.value }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="controllerNoUnique">
                      <Form.Label>Controller No</Form.Label>
                      <Form.Control
                        value={paymentForm.controllerNoUnique}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, controllerNoUnique: e.target.value }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="imeiNoUnique">
                      <Form.Label>IMEI No</Form.Label>
                      <Form.Control
                        value={paymentForm.imeiNoUnique}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, imeiNoUnique: e.target.value }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group controlId="panels">
                      <Form.Label>Panels</Form.Label>
                      <Form.Control
                        value={paymentForm.panels.join(', ')}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            panels: e.target.value.split(',').map((p) => p.trim()).filter((p) => p),
                          }))
                        }
                        placeholder="Enter panel IDs separated by commas"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="installationDoneYesNo">
                      <Form.Label>Installation Done</Form.Label>
                      <Form.Select
                        value={paymentForm.installationDoneYesNo}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            installationDoneYesNo: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="pumpNotOperatingYesNo">
                      <Form.Label>Pump Operating</Form.Label>
                      <Form.Select
                        value={paymentForm.pumpNotOperatingYesNo}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            pumpNotOperatingYesNo: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="companyAssignedPersonName">
                      <Form.Label>Assigned Person</Form.Label>
                      <Form.Control
                        value={paymentForm.companyAssignedPersonName}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            companyAssignedPersonName: e.target.value,
                          }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="chargesToDebit">
                      <Form.Label>Charges to Debit (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.chargesToDebit}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            chargesToDebit: e.target.value,
                          }))
                        }
                        min="0"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="subcontractorRate">
                      <Form.Label>Subcontractor Rate (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.subcontractorRate}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            subcontractorRate: e.target.value,
                          }))
                        }
                        min="0"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="subcontractorBill">
                      <Form.Label>Subcontractor Bill (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.subcontractorBill}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            subcontractorBill: e.target.value,
                          }))
                        }
                        min="0"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="paymentGivenToSubcontractor">
                      <Form.Label>Payment Given (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.paymentGivenToSubcontractor}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            paymentGivenToSubcontractor: e.target.value,
                          }))
                        }
                        min="0"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="paymentPending">
                      <Form.Label>Payment Pending (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.paymentPending}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            paymentPending: e.target.value,
                          }))
                        }
                        min="0"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group controlId="sitePhotos">
                      <Form.Label>Site Photos (URLs)</Form.Label>
                      <Form.Control
                        value={paymentForm.sitePhotos}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, sitePhotos: e.target.value }))
                        }
                        placeholder="Enter photo URLs separated by commas"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-end mt-4">
                  <Button variant="secondary" className="me-2" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Submit & Close
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>{editingUser ? 'Edit User' : 'Add User'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={submitUserForm}>
                <Form.Group controlId="username" className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.username}
                    onChange={(e) => handleUserFormChange('username', e.target.value)}
                    required
                    disabled={!!editingUser}
                  />
                </Form.Group>
                <Form.Group controlId="email" className="mb-3">
                  <Form.Label>Email <span className="text-muted">(used for secure password recovery)</span></Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => handleUserFormChange('email', e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </Form.Group>
                <Form.Group controlId="mobile" className="mb-3">
                  <Form.Label>Mobile</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.mobile}
                    onChange={(e) => handleUserFormChange('mobile', e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="password" className="mb-3">
                  <Form.Label>Password {editingUser ? '(Leave blank to keep unchanged)' : ''}</Form.Label>
                  <Form.Control
                    type="password"
                    minLength={editingUser ? undefined : 12}
                    maxLength={128}
                    value={userForm.password}
                    onChange={(e) => handleUserFormChange('password', e.target.value)}
                    required={!editingUser}
                  />
                </Form.Group>
                <Form.Group controlId="role" className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => handleUserFormChange('role', e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="field_technician">Field Technician</option>
                    <option value="superadmin">Super Admin</option>
                  </Form.Select>
                </Form.Group>
                <div className="text-end">
                  <Button variant="secondary" className="me-2" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={userLoading}>
                    {userLoading ? <Spinner animation="border" size="sm" /> : 'Save'}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          <Modal show={showManagePaymentsModal} onHide={() => setShowManagePaymentsModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Manage Payments for {manageTech?.username}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {manageTechFarmers.length === 0 ? (
                <p>No completed farmers to manage payments for.</p>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Farmer Name</th>
                        <th>Beneficiary ID</th>
                        <th>Payment Given (₹)</th>
                        <th>Payment Pending (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manageTechFarmers.map((f) => (
                        <tr key={f._id}>
                          <td>{f.beneficiaryName}</td>
                          <td>{f.beneficiaryId}</td>
                          <td>
                            <Form.Control
                              type="number"
                              value={f.paymentGivenToSubcontractor}
                              onChange={(e) =>
                                handleManagePaymentChange(f._id, 'paymentGivenToSubcontractor', e.target.value)
                              }
                              min="0"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              value={f.paymentPending}
                              onChange={(e) =>
                                handleManagePaymentChange(f._id, 'paymentPending', e.target.value)
                              }
                              min="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowManagePaymentsModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveManagePayments}>
                Save Payments
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </Container>
  );
}
