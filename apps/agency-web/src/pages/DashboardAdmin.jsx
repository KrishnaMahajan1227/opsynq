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
} from 'react-bootstrap';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
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
  FaEdit,
  FaTrash,
  FaUpload,
  FaSignOutAlt,
  FaFilter,
  FaArrowLeft,
} from 'react-icons/fa';
import axios from 'axios';
import debounce from 'lodash/debounce';
import EditFarmerModal from '../components/EditFarmerModal';
import FarmerDetailView from '../components/FarmerDetailView';
import TechLocationMonitor from '../components/TechLocationMonitor';
import TechLocationMap from '../components/TechLocationMap';
import { MAHARASHTRA_DIVISIONS } from '../constants/maharashtraGeo';
import './DashboardAdmin.css';
import './AdminEnterprise.css';

import { API_URL } from '../config.js';
import { getAgencyCached } from '../resilientAxios';
import AgencySidebar from '../components/AgencySidebar';
import AgencyWorkspaceHeader from '../components/AgencyWorkspaceHeader';
import MaterialReceiptsPanel from '../components/MaterialReceiptsPanel';
import AgencyRmsPanel,{AgencyRmsSummary} from '../components/AgencyRmsPanel';
import AgencyReportsPanel from '../components/AgencyReportsPanel';
import AgencyTeamAccessPanel from '../components/AgencyTeamAccessPanel';
import AgencyTechnicianAssignmentModal from '../components/AgencyTechnicianAssignmentModal';
import { confirmAction } from '../utils/confirmAction';

// Constants for dropdowns
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
const FINAL_INSPECTION_STATUSES = [
  'Blocked for further process because PP consumer number of other consumer used',
  'VENDOR INFORMATION RECEIVED',
  'Refund Process Completed and Amount transferred to Beneficiary',
  'PUMP INSTALLATION DETAILS RECEIVED FROM VENDOR',
  'PUMP INSTALLATION INSPECTION DONE BY LINEMAN',
  'SYSTEM DETAILS SUBMITTED',
  '',
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

// Colors for pie charts
const PIE_COLORS = [
  '#304b45',
  '#54736b',
  '#789089',
  '#b08a4a',
  '#7c8791',
  '#aa555c',
  '#4f5d68',
  '#a8b1b7',
  '#667d76',
];

export default function DashboardAdmin() {
  const navigate = useNavigate();
  // State Management
  const [farmers, setFarmers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab') || localStorage.getItem('opsynq_agency_active_tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    if (activeTab === 'farmer-detail') return;
    localStorage.setItem('opsynq_agency_active_tab', activeTab);
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === activeTab) return;
    params.set('tab', activeTab);
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
  }, [activeTab, location.pathname, location.search, navigate]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [opsFiltersOpen, setOpsFiltersOpen] = useState('');
  const [opsDistrictFilter, setOpsDistrictFilter] = useState('');
  const [opsSurveyorFilter, setOpsSurveyorFilter] = useState('');
  const [opsStatusFilter, setOpsStatusFilter] = useState('');
  const [detailFarmer, setDetailFarmer] = useState(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    setOpsFiltersOpen('');
    setOpsDistrictFilter('');
    setOpsSurveyorFilter('');
    setOpsStatusFilter('');
  }, [activeTab]);

  // Farmer Records Tab States
  const [selectedFarmers, setSelectedFarmers] = useState([]);
  const [bulkSurveyor, setBulkSurveyor] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkInspectionStatus, setBulkInspectionStatus] = useState('');
  const [bulkInspectionStatusFinal, setBulkInspectionStatusFinal] = useState('');
  const [installationSearch, setInstallationSearch] = useState('');
  const [completedSearch, setCompletedSearch] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [searchName, setSearchName] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [talukaFilter, setTalukaFilter] = useState('');
  const [surveyorFilter, setSurveyorFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [jsrFilter, setJsrFilter] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  const [inspectionFilter, setInspectionFilter] = useState('');
  const [finalInspectionFilter, setFinalInspectionFilter] = useState('');
  const [schemeGroupFilter, setSchemeGroupFilter] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('');
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);

  // Modal States
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAssignTechnicianModal, setShowAssignTechnicianModal] = useState(false);
  const [assignmentFarmer, setAssignmentFarmer] = useState(null);

  // Form States
  const [reworkData, setReworkData] = useState({});
  const [assignTechnicianForm, setAssignTechnicianForm] = useState({
    surveyorName: '',
    surveyorMobile: '',
    reason: '',
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
    finalInspectionStatus: '',
    jsrDeviationYesNo: '',
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

  // Technician Summary States
  const [showManagePaymentsModal, setShowManagePaymentsModal] = useState(false);
  const [manageTech, setManageTech] = useState(null);
  const [manageTechFarmers, setManageTechFarmers] = useState([]);
  const [monthFilter, setMonthFilter] = useState('');

  // Authentication Headers
  const role = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const auth = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  // Filter Dropdown Data from MAHARASHTRA_DIVISIONS
  const allDivisions = MAHARASHTRA_DIVISIONS.map((div) => div.name).sort();
  const allDistricts = MAHARASHTRA_DIVISIONS.flatMap((div) => div.districts.map((d) => d.name)).sort();
  const allTalukas = (districtName) => {
    const found = MAHARASHTRA_DIVISIONS.flatMap((div) =>
      div.districts.filter((d) => d.name === districtName)
    )[0];
    return found ? found.talukas.sort() : [];
  };

  // Data Fetching Functions
  const applyFarmerList = useCallback((list) => {
    const rows = Array.isArray(list) ? list : [];
    setFarmers(rows);
    const initialReworkData = {};
    rows.forEach((f) => {
      if (f.applicationStatus === 'Complaint Raised') initialReworkData[f._id] = {
        reWork: f.reWork || '', issues: f.issues || '', reworkAssignTechnician: f.reworkAssignTechnician || '', reworkAssignDate: f.reworkAssignDate || '', solutionDate: f.solutionDate || '',
      };
    });
    setReworkData(initialReworkData);
  }, []);

  const fetchFarmers = useCallback(async () => {
    setIsLoading(true);
    const url = `${API_URL}/api/farmers`;
    let renderedCache = false;
    try {
      if (!token) throw new Error('Authentication token is missing. Please log in again.');
      const cached = await getAgencyCached(url, { maxAge: 6 * 60 * 60 * 1000 });
      if (cached?.data) { applyFarmerList(cached.data); renderedCache = true; setIsLoading(false); }
      const response = await axios.get(url, { ...auth, opsynqNoCache: true });
      applyFarmerList(response.data);
    } catch (error) {
      console.error('Failed to fetch farmers:', error);
      if (!renderedCache) setToast({ show: true, variant: 'danger', message: `Failed to fetch farmers: ${error.message}` });
      if (error.message.includes('Authentication token')) window.location.href = import.meta.env.PROD ? '/?login=1' : '/';
    } finally { setIsLoading(false); }
  }, [token, applyFarmerList]);

  const fetchTechnicians = useCallback(async () => {
    try {
      if (!token) throw new Error('Authentication token is missing. Please log in again.');
      const response = await axios.get(`${API_URL}/api/users/technicians`, auth);
      const userList = Array.isArray(response.data) ? response.data : [];
      setTechnicians(userList);
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to fetch technicians: ${error.message}`,
      });
      if (error.message.includes('Authentication token')) {
        window.location.href = import.meta.env.PROD ? '/?login=1' : '/';
      }
      setTechnicians([]);
    }
  }, [token]);

  const fetchChangeRequests = useCallback(async () => {
    try {
      if (!token || !userId) throw new Error('Authentication token or user ID is missing. Please log in again.');
      const response = await axios.get(
        `${API_URL}/api/farmers/change-requests?adminId=${userId}`,
        auth
      );
      const requests = Array.isArray(response.data) ? response.data : [];
      setChangeRequests(requests);
    } catch (error) {
      console.error('Failed to fetch change requests:', error);
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to fetch change requests: ${error.message}`,
      });
      if (error.message.includes('Authentication token')) {
        window.location.href = import.meta.env.PROD ? '/?login=1' : '/';
      }
      setChangeRequests([]);
    }
  }, [token, userId]);

  // Load once. Tab changes must not refetch the full beneficiary portfolio.
  useEffect(() => {
    if (!token || !userId || !role) {
      setToast({ show: true, variant: 'danger', message: 'Please log in to access the dashboard.' });
      window.location.href = import.meta.env.PROD ? '/?login=1' : '/';
      return;
    }
    Promise.all([fetchFarmers(), fetchTechnicians(), fetchChangeRequests()]).catch((err) => {
      setToast({ show: true, variant: 'danger', message: `Initial data fetch failed: ${err.message}` });
    });
  }, [fetchFarmers, fetchTechnicians, fetchChangeRequests, token, userId, role]);

  useEffect(() => {
    const onDataRefresh = () => { Promise.all([fetchFarmers(), fetchTechnicians(), fetchChangeRequests()]).catch(() => {}); };
    window.addEventListener('opsynq:data-refresh', onDataRefresh);
    return () => window.removeEventListener('opsynq:data-refresh', onDataRefresh);
  }, [fetchFarmers, fetchTechnicians, fetchChangeRequests]);

  useEffect(() => {
    if (activeTab !== 'complaints') return undefined;
    const intervalId = setInterval(() => {
      Promise.all([fetchFarmers(), fetchChangeRequests()]).catch(() => {});
    }, 30000);
    return () => clearInterval(intervalId);
  }, [activeTab, fetchFarmers, fetchChangeRequests]);

  useEffect(() => {
    setSchemeFilter('');
    setPage(1);
  }, [schemeGroupFilter]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchFarmers(), fetchTechnicians(), fetchChangeRequests()]);
      setToast({
        show: true,
        variant: 'success',
        message: 'Data refreshed successfully',
      });
    } catch (error) {
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to refresh data: ${error.message}`,
      });
      if (error.message.includes('Authentication token')) {
        window.location.href = import.meta.env.PROD ? '/?login=1' : '/';
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFarmers, fetchTechnicians, fetchChangeRequests]);

  // Debounced Search Handler
  const debouncedSetSearchName = useCallback(
    debounce((value) => {
      setSearchName(value);
      setPage(1);
    }, 300),
    []
  );

  // Helper Functions
  const getTechnicianDisplay = (username) => {
    if (!username) return 'Not Assigned';
    const technician = technicians.find((u) => u.username === username);
    return technician ? `${technician.username} (${technician.mobile})` : 'Unknown Technician';
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

  const hasPendingTechnicianRequest = (farmerId, farmerIds = []) => {
    return changeRequests.some(
      (req) =>
        req.status === 'Pending' &&
        (req.farmerId?.toString() === farmerId?.toString() ||
          farmerIds.some((id) => req.farmerId?.toString() === id.toString()))
    );
  };

  // Farmer Handlers
  const handleBulkSurveyorUpdate = async () => {
    if (selectedFarmers.length === 0) {
      setToast({ show: true, variant: 'danger', message: 'Please select at least one farmer' });
      return;
    }
    if (!bulkSurveyor) {
      setToast({ show: true, variant: 'danger', message: 'Please select a surveyor' });
      return;
    }
    if (!bulkReason.trim()) {
      setToast({ show: true, variant: 'danger', message: 'Please provide a reason' });
      return;
    }
    if (hasPendingTechnicianRequest(null, selectedFarmers)) {
      setToast({
        show: true,
        variant: 'warning',
        message: 'A technician update request is pending for one or more farmers',
      });
      return;
    }
    try {
      const selectedSurveyor = technicians.find((t) => t.username === bulkSurveyor);
      if (!selectedSurveyor) throw new Error('Invalid surveyor selected');
      const payload = {
        farmerIds: selectedFarmers,
        update: {
          surveyorName: selectedSurveyor.username,
          surveyorMobile: selectedSurveyor.mobile,
        },
        reason: bulkReason,
      };
      await axios.post(`${API_URL}/api/farmers/bulk-update`, payload, auth);
      setToast({
        show: true,
        variant: 'success',
        message:
          role === 'superadmin'
            ? 'Surveyors updated successfully'
            : 'Surveyor update request submitted',
      });
      setSelectedFarmers([]);
      setBulkSurveyor('');
      setBulkReason('');
      await Promise.all([fetchFarmers(), fetchChangeRequests()]);
    } catch (error) {
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to submit bulk update request: ${error.response?.data?.message || error.message}`,
      });
    }
  };

  const handleBulkInspectionStatusUpdate = async () => {
    if (!selectedFarmers.length || !bulkInspectionStatus) { setToast({show:true,variant:'warning',message:'Select records and a survey status'}); return; }
    try { await axios.post(`${API_URL}/api/farmers/bulk-update`, { farmerIds:selectedFarmers, update:{inspectionStatus:bulkInspectionStatus} }, auth); setSelectedFarmers([]); setBulkInspectionStatus(''); await fetchFarmers(); setToast({show:true,variant:'success',message:'Survey status updated'}); }
    catch (error) { setToast({show:true,variant:'danger',message:error.response?.data?.message || 'Failed to update survey status'}); }
  };

  const handleBulkInspectionStatusFinalUpdate = async () => {
    if (!selectedFarmers.length || !bulkInspectionStatusFinal) { setToast({show:true,variant:'warning',message:'Select records and a final inspection status'}); return; }
    try { await axios.post(`${API_URL}/api/farmers/bulk-update`, { farmerIds:selectedFarmers, update:{inspectionStatusFinal:bulkInspectionStatusFinal} }, auth); setSelectedFarmers([]); setBulkInspectionStatusFinal(''); await fetchFarmers(); setToast({show:true,variant:'success',message:'Final inspection status updated'}); }
    catch (error) { setToast({show:true,variant:'danger',message:error.response?.data?.message || 'Failed to update final inspection status'}); }
  };

  const toggleFarmerSelection = (farmerId) => {
    setSelectedFarmers((prev) =>
      prev.includes(farmerId) ? prev.filter((id) => id !== farmerId) : [...prev, farmerId]
    );
  };

  const handleStatusChange = async (id, newStatus, farmer) => {
    if (!id || !newStatus) {
      setToast({ show: true, variant: 'danger', message: 'Invalid status update request' });
      return;
    }
    try {
      const payload = { applicationStatus: newStatus };
      if (newStatus === 'Ready for Installation' && assignTechnicianForm.surveyorName) {
        if (!assignTechnicianForm.surveyorName || !assignTechnicianForm.reason) {
          setToast({
            show: true,
            variant: 'danger',
            message: 'Please select a technician and provide a reason',
          });
          return;
        }
        if (hasPendingTechnicianRequest(id)) {
          setToast({
            show: true,
            variant: 'warning',
            message: 'A technician update request is pending for this farmer',
          });
          return;
        }
        payload.surveyorName = assignTechnicianForm.surveyorName;
        payload.surveyorMobile = assignTechnicianForm.surveyorMobile;
        payload.reason = assignTechnicianForm.reason;
      }
      await axios.put(`${API_URL}/api/farmers/${id}`, payload, auth);
      setToast({
        show: true,
        variant: 'success',
        message:
          role === 'superadmin' || !payload.surveyorName
            ? 'Application status updated'
            : 'Status and technician update request submitted',
      });
      await Promise.all([fetchFarmers(), fetchChangeRequests()]);
      setShowAssignTechnicianModal(false);
      setAssignTechnicianForm({ surveyorName: '', surveyorMobile: '', reason: '' });
    } catch (error) {
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to update status: ${error.response?.data?.message || error.message}`,
      });
    }
  };

  const handleJSRChange = async (id, newJSR) => {
    try {
      await axios.put(
        `${API_URL}/api/farmers/${id}`,
        { jsrDeviationYesNo: newJSR || undefined },
        auth
      );
      setToast({ show: true, variant: 'success', message: 'JSR updated successfully' });
      await fetchFarmers();
    } catch (error) {
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to update JSR: ${error.response?.data?.message || error.message}`,
      });
    }
  };

  const handleReworkSubmit = async (farmerId) => {
    const data = reworkData[farmerId];
    if (!data?.reWork || !data?.issues || !data?.reworkAssignTechnician) {
      setToast({ show: true, variant: 'danger', message: 'Add the rework instruction, issue details and technician.' });
      return;
    }
    if (hasPendingTechnicianRequest(farmerId)) {
      setToast({ show: true, variant: 'warning', message: 'A technician assignment request is already pending for this beneficiary.' });
      return;
    }
    try {
      const selectedTechnician = technicians.find((t) => t.username === data.reworkAssignTechnician);
      if (!selectedTechnician?._id) throw new Error('Select an active technician from this Agency.');
      await axios.put(`${API_URL}/api/farmers/${farmerId}`, {
        reWork: data.reWork,
        issues: data.issues,
        reworkAssignDate: data.reworkAssignDate || new Date().toISOString(),
        solutionDate: data.solutionDate || undefined,
        reason: 'Complaint rework details updated',
      }, auth);
      const assignment = await axios.post(`${API_URL}/api/farmers/${farmerId}/assign-technician`, {
        assignmentType: 'REWORK',
        technicianId: selectedTechnician._id,
        reason: `Complaint rework: ${data.issues}`,
      }, auth);
      setToast({
        show: true,
        variant: assignment.status === 202 ? 'warning' : 'success',
        message: assignment.data?.message || 'Rework assignment saved.',
      });
      await Promise.all([fetchFarmers(), fetchChangeRequests()]);
    } catch (error) {
      setToast({ show: true, variant: 'danger', message: `Failed to update complaint: ${error.response?.data?.message || error.message}` });
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
          : paymentForm.panels
              .split(',')
              .map((p) => p.trim())
              .filter((p) => p),
        sitePhotos: paymentForm.sitePhotos
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p),
        applicationStatus: 'Closed',
        finalInspectionStatus: paymentForm.finalInspectionStatus || '',
      };
      if (paymentForm.surveyorName && paymentForm.surveyorName !== selectedFarmer.surveyorName) {
        if (hasPendingTechnicianRequest(selectedFarmer._id)) {
          setToast({
            show: true,
            variant: 'warning',
            message: 'A technician update request is pending for this farmer',
          });
          return;
        }
        if (role !== 'superadmin') {
          await axios.post(
            `${API_URL}/api/farmers/bulk-update`,
            {
              farmerIds: [selectedFarmer._id],
              update: {
                surveyorName: paymentForm.surveyorName,
                surveyorMobile: paymentForm.surveyorMobile,
              },
              reason: 'Payment record technician assignment',
            },
            auth
          );
          delete updatePayload.surveyorName;
          delete updatePayload.surveyorMobile;
          setToast({
            show: true,
            variant: 'success',
            message: 'Technician assignment request submitted',
          });
        }
      }
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
        finalInspectionStatus: '',
        jsrDeviationYesNo: '',
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
      await Promise.all([fetchFarmers(), fetchChangeRequests()]);
      setToast({ show: true, variant: 'success', message: 'Payment details updated successfully' });
    } catch (error) {
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to update payment details: ${error.response?.data?.message || error.message}`,
      });
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
    setAssignTechnicianForm((prev) => ({
      ...prev,
      surveyorName: username,
      surveyorMobile: selectedTechnician ? selectedTechnician.mobile : '',
    }));
  };

  const downloadFilteredCSV = () => {
    const listToExport = selectedFarmers.length > 0 ? farmers.filter((f) => selectedFarmers.includes(f._id)) : filtered;

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
        if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val))) {
          return `"${val}"`;
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
    link.setAttribute('download', 'farmers_export.csv');
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
      const updates = manageTechFarmers
        .map((f) => {
          const original = farmers.find((orig) => orig._id === f._id);
          if (!original) return null;
          const newGiven = parseFloat(f.paymentGivenToSubcontractor) || 0;
          const newPending = parseFloat(f.paymentPending) || 0;
          const origGiven = parseFloat(original.paymentGivenToSubcontractor) || 0;
          const origPending = parseFloat(original.paymentPending) || 0;
          if (newGiven !== origGiven || newPending !== origPending) {
            return {
              farmerId: f._id,
              update: {
                paymentGivenToSubcontractor: String(newGiven),
                paymentPending: String(newPending),
              },
            };
          }
          return null;
        })
        .filter(Boolean);

      if (updates.length > 0) {
        await Promise.all(
          updates.map(({ farmerId, update }) =>
            axios.put(`${API_URL}/api/farmers/${farmerId}`, update, auth)
          )
        );
        setToast({ show: true, variant: 'success', message: 'Payments updated successfully' });
      } else {
        setToast({ show: true, variant: 'info', message: 'No changes to save' });
      }
      setShowManagePaymentsModal(false);
      await fetchFarmers();
    } catch (error) {
      setToast({
        show: true,
        variant: 'danger',
        message: `Failed to save payments: ${error.response?.data?.message || error.message}`,
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
    const matchesFinalInsp = !finalInspectionFilter || f.inspectionStatusFinal === finalInspectionFilter;
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
      matchesFinalInsp &&
      matchesSchemeGroup &&
      matchesScheme
    );
  });

  if (showDelayedOnly) {
    filtered = filtered.filter((f) => isPendingTooLong(f));
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Tab-Specific Data
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
  const matchesQuickSearch = (f, term) => { const q=term.trim().toLowerCase(); if(!q) return true; return [f.beneficiaryName,f.beneficiaryId,f.mobile,f.district,f.taluka,f.village,f.surveyorName,f.applicationStatus].some((v)=>String(v||'').toLowerCase().includes(q)); };
  const matchesOpsFilters = (f) => (!opsDistrictFilter || f.district === opsDistrictFilter) && (!opsSurveyorFilter || f.surveyorName === opsSurveyorFilter) && (!opsStatusFilter || f.applicationStatus === opsStatusFilter);
  const visibleInstallationRecords = installationRecords.filter((f) => matchesQuickSearch(f, installationSearch) && matchesOpsFilters(f));
  const visibleCompletedRecords = completedRecords.filter((f) => matchesQuickSearch(f, completedSearch) && matchesOpsFilters(f));
  const visibleComplaintRecords = complaintRecords.filter((f) => matchesQuickSearch(f, complaintSearch) && matchesOpsFilters(f));

  // Technician Summary Calculation
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
        ((f.reworkAssignTechnician || f.surveyorName || '').toLowerCase() === usernameLower) &&
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
        : new Date(f.createdAt);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      if (!monthMap[key]) {
        monthMap[key] = { count: 0, paymentGivenSum: 0, paymentPendingSum: 0 };
      }
      monthMap[key].count++;
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

  // Pie Chart Data
  const applicationStatusData = APPLICATION_STATUSES.map((s, index) => ({
    name: s,
    value: safeFarmers.filter((f) => f.applicationStatus === s).length,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }));

  const surveyStatusData = INSPECTION_STATUSES.map((s, index) => ({
    name: s,
    value: safeFarmers.filter((f) => f.inspectionStatus === s).length,
    color: ['#aa555c', '#b08a4a', '#3d7d61'][index],
  }));




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

  // Render
  return (
    <Container fluid className="dashboard-admin">
      <Toast
        bg={toast.variant}
        onClose={() => setToast({ ...toast, show: false })}
        show={toast.show}
        autohide
        delay={3000}
        style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 2000 }}
      >
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>

      <div className="dashboard-shell">
        <AgencySidebar
          role="admin"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={isSidebarCollapsed}
          setCollapsed={setIsSidebarCollapsed}
          onLogout={handleLogout}
          onResetSelection={() => { setPage(1); setSelectedFarmers([]); }}
        />

        <main className={`dashboard-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <AgencyWorkspaceHeader activeTab={activeTab} role="admin" />

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

          {activeTab === 'overview' && !isLoading && <AgencyRmsSummary onOpen={()=>setActiveTab('rms')} />}
          {activeTab === 'overview' && !isLoading && (
            <div className="executive-dashboard">
              <div className="dashboard-commandbar">
                <div><strong>Operations pulse</strong><span>Live field and installation workload</span></div>
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
                  <Card.Header><div><strong>Application pipeline</strong><span>Current beneficiary distribution by stage</span></div></Card.Header>
                  <Card.Body>
                    <div className="pipeline-list">
                      {applicationStatusData.filter((item) => item.value > 0).map((item) => {
                        const pct = safeFarmers.length ? Math.round((item.value / safeFarmers.length) * 100) : 0;
                        return <div className="pipeline-row" key={item.name}><div className="pipeline-row__meta"><span>{item.name}</span><strong>{item.value} <small>{pct}%</small></strong></div><div className="pipeline-track"><span style={{ width: `${Math.max(pct, item.value ? 2 : 0)}%` }} /></div></div>;
                      })}
                    </div>
                  </Card.Body>
                </Card>
                <Card className="panel panel--chart">
                  <Card.Header><div><strong>Survey health</strong><span>Inspection completion mix</span></div></Card.Header>
                  <Card.Body className="donut-panel">
                    <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={surveyStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={2}>{surveyStatusData.map((entry, index) => <Cell key={`survey-${index}`} fill={entry.color} />)}</Pie><RechartsTooltip /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{safeFarmers.length}</strong><span>records</span></div></div>
                    <div className="chart-legend">{surveyStatusData.map((item) => <div key={item.name}><span className="legend-dot" style={{ background: item.color }} /><span>{item.name}</span><strong>{item.value}</strong></div>)}</div>
                  </Card.Body>
                </Card>
              </div>

              <div className="dashboard-grid dashboard-grid--secondary">
                <Card className="panel attention-panel">
                  <Card.Header><div><strong>Operational attention</strong><span>Items that may require intervention</span></div></Card.Header>
                  <Card.Body>
                    <div className="attention-list">
                      <button onClick={() => setActiveTab('complaints')}><span><FaExclamationTriangle /> Open complaints</span><strong>{safeFarmers.filter((f) => f.applicationStatus === 'Complaint Raised').length}</strong></button>
                      <button onClick={() => { setShowDelayedOnly(true); setActiveTab('records'); }}><span><FaExclamationTriangle /> Delayed installations</span><strong>{delayedInstallations}</strong></button>
                      <button onClick={() => setActiveTab('installation')}><span><FaTools /> Ready / active installation work</span><strong>{safeFarmers.filter((f) => ['Move to Installation','Ordered','Dispatch Completed','Ready for Installation','Pending Installation'].includes(f.applicationStatus)).length}</strong></button>
                    </div>
                  </Card.Body>
                </Card>
                <Card className="panel quick-nav-panel">
                  <Card.Header><div><strong>Quick access</strong><span>Common operational workspaces</span></div></Card.Header>
                  <Card.Body><div className="quick-nav-grid">
                    <button onClick={() => setActiveTab('records')}><FaDatabase /><span>Farmer records</span><small>Search & manage</small></button>
                    <button onClick={() => setActiveTab('installation')}><FaTools /><span>Installation</span><small>Orders & assignments</small></button>
                    <button onClick={() => setActiveTab('technician-summary')}><FaCheckCircle /><span>Technicians</span><small>Performance & payments</small></button>
                  </div></Card.Body>
                </Card>
              </div>

              <div className="dashboard-grid dashboard-grid--field">
                <div className="field-widget"><TechLocationMonitor /></div>
                <div className="field-widget"><TechLocationMap /></div>
              </div>
            </div>
          )}

          {activeTab === 'records' && !isLoading && (
            <Card className="mb-4 farmer-records-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Farmer Records</span>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={refreshAll}
                    disabled={isLoading}
                  >
                    <FaSyncAlt className="me-1" /> Refresh
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={downloadFilteredCSV}>
                    <FaDatabase className="me-1" /> Download CSV
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="records-commandbar">
                  <div className="records-search"><span>⌕</span><Form.Control placeholder="Search farmer, beneficiary ID or Aadhar…" onChange={(e)=>debouncedSetSearchName(e.target.value)} /></div>
                  <Button variant="outline-secondary" onClick={()=>setFiltersOpen((prev)=>!prev)}><FaFilter className="me-1" /> Advanced filters</Button>
                  <div className="records-commandbar__count"><strong>{filtered.length}</strong><span>records</span></div>
                </div>
                <div className="bulk-actionbar">
                  <div className="bulk-actionbar__selection"><strong>{selectedFarmers.length}</strong><span>selected</span></div>
                  <div className="bulk-control bulk-control--reason"><label>Bulk Update Surveyor</label><div><Form.Select value={bulkSurveyor} onChange={(e)=>setBulkSurveyor(e.target.value)}><option value="">Select surveyor</option>{uniqueSurveyors.map((s)=><option key={s} value={s}>{getTechnicianDisplay(s)}</option>)}</Form.Select><Form.Control value={bulkReason} onChange={(e)=>setBulkReason(e.target.value)} placeholder="Reason for reassignment" /><Button onClick={handleBulkSurveyorUpdate} disabled={!selectedFarmers.length || !bulkSurveyor || !bulkReason.trim()}>Apply</Button></div></div>
                  <div className="bulk-control"><label>Bulk Update Survey Status</label><div><Form.Select value={bulkInspectionStatus} onChange={(e)=>setBulkInspectionStatus(e.target.value)}><option value="">Select status</option>{INSPECTION_STATUSES.map((status)=><option key={status} value={status}>{status}</option>)}</Form.Select><Button onClick={handleBulkInspectionStatusUpdate} disabled={!selectedFarmers.length || !bulkInspectionStatus}>Apply</Button></div></div>
                  <div className="bulk-control bulk-control--wide"><label>Bulk Update Final Inspection Status</label><div><Form.Select value={bulkInspectionStatusFinal} onChange={(e)=>setBulkInspectionStatusFinal(e.target.value)}><option value="">Select final status</option>{FINAL_INSPECTION_STATUSES.filter(Boolean).map((status)=><option key={status} value={status}>{status}</option>)}</Form.Select><Button onClick={handleBulkInspectionStatusFinalUpdate} disabled={!selectedFarmers.length || !bulkInspectionStatusFinal}>Apply</Button></div></div>
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
                          <Form.Label>Assigned vendor / company</Form.Label>
                          <Form.Select
                            value={vendorFilter}
                            onChange={(e) => {
                              setVendorFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All assigned vendors</option>
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
                          <Form.Label>Insp Status</Form.Label>
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
                        <Form.Group controlId="finalInspectionFilter">
                          <Form.Label>Final Insp Status</Form.Label>
                          <Form.Select
                            value={finalInspectionFilter}
                            onChange={(e) => {
                              setFinalInspectionFilter(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Statuses</option>
                            {FINAL_INSPECTION_STATUSES.map((s) => (
                              <option key={s} value={s}>
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
                            {['MSEDCL', 'MEDA', 'PM KUSUM', 'Atal', 'MSKPY', 'MTSKPY'].map((group) => (
                              <option key={group} value={group}>
                                {group}
                              </option>
                            ))}
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
                        <Form.Group controlId="showDelayedOnly">
                          <Form.Label>Delayed Installs</Form.Label>
                          <Form.Check
                            type="checkbox"
                            label="Show Only Delayed"
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

                <Row className="bulk-update-row mb-4">
                  <Col md={4} className="d-flex align-items-end">
                    <Button
                      variant="primary"
                      onClick={handleBulkSurveyorUpdate}
                      disabled={isLoading || selectedFarmers.length === 0}
                    >
                      Update Selected ({selectedFarmers.length})
                    </Button>
                  </Col>
                </Row>

                <Table responsive striped hover className="records-table">
                  <thead>
                    <tr>
                      <th>
                        <Form.Check
                          type="checkbox"
                          checked={selectedFarmers.length === paginated.length && paginated.length > 0}
                          onChange={() => {
                            if (selectedFarmers.length === paginated.length) {
                              setSelectedFarmers([]);
                            } else {
                              setSelectedFarmers(paginated.map((f) => f._id));
                            }
                          }}
                        />
                      </th>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Aadhar</th>
                      <th>Scheme</th>
                      <th>Village</th>
                      <th>Taluka</th>
                      <th>District</th>
                      <th>Surveyor</th>
                      <th>Assigned vendor / company</th>
                      <th>JSR</th>
                      <th>App Status</th>
                      <th>Insp Status</th>
                      <th>Final Insp Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((farmer) => (
                      <tr key={farmer._id} className="farmer-clickable-row" title="Open beneficiary details" onClick={(e) => openFarmerDetail(farmer, e)}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedFarmers.includes(farmer._id)}
                            onChange={() => toggleFarmerSelection(farmer._id)}
                          />
                        </td>
                        <td>{farmer.beneficiaryId}</td>
                        <td>{farmer.beneficiaryName}</td>
                        <td>{farmer.mobile}</td>
                        <td>{farmer.aadharNo}</td>
                        <td>{farmer.scheme}</td>
                        <td>{farmer.village}</td>
                        <td>{farmer.taluka}</td>
                        <td>{farmer.district}</td>
                        <td>{getTechnicianDisplay(farmer.surveyorName)}</td>
                        <td>{farmer.assignedVendorCompanyName}</td>
                        <td>
                          <Form.Select
                            size="sm"
                            value={farmer.jsrDeviationYesNo || ''}
                            onChange={(e) => handleJSRChange(farmer._id, e.target.value)}
                            disabled={isLoading}
                          >
                            <option value="">NO</option>
                            <option value="JSR OUTCOME ACCEPTED">JSR OUTCOME ACCEPTED</option>
                            <option value="JSR OUTCOME REJECTED">JSR OUTCOME REJECTED</option>
                            <option value="JSR SUBMITTED">JSR SUBMITTED</option>
                            <option value="JSR IN DISCREPANCY">JSR IN DISCREPANCY</option>
                            <option value="VENDOR INFORMATION RECEIVED">VENDOR INFORMATION RECEIVED</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Select
                            size="sm"
                            value={farmer.applicationStatus}
                            onChange={(e) => {
                              if (e.target.value === 'Ready for Installation') {
                                setSelectedFarmer(farmer);
                                setShowAssignTechnicianModal(true);
                              } else {
                                handleStatusChange(farmer._id, e.target.value, farmer);
                              }
                            }}
                            disabled={isLoading}
                          >
                            {APPLICATION_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          <Badge
                            bg={
                              farmer.inspectionStatus === 'Completed'
                                ? 'success'
                                : farmer.inspectionStatus === 'In Progress'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {farmer.inspectionStatus}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            bg={
                              farmer.inspectionStatusFinal === 'SYSTEM DETAILS SUBMITTED' ||
                              farmer.inspectionStatusFinal === 'PUMP INSTALLATION INSPECTION DONE BY LINEMAN'
                                ? 'success'
                                : farmer.inspectionStatusFinal === 'VENDOR INFORMATION RECEIVED' ||
                                  farmer.inspectionStatusFinal === 'PUMP INSTALLATION DETAILS RECEIVED FROM VENDOR'
                                ? 'warning'
                                : farmer.inspectionStatusFinal === 'Blocked for further process because PP consumer number of other consumer used'
                                ? 'danger'
                                : 'secondary'
                            }
                          >
                            {farmer.inspectionStatusFinal || 'None'}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="outline-secondary" size="sm" className="me-1" onClick={() => setAssignmentFarmer(farmer)}><FaUsers className="me-1" /> Assign</Button>
                          <OverlayTrigger
                            overlay={<Tooltip>Edit Farmer</Tooltip>}
                          >
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => {
                                setSelectedFarmer(farmer);
                                setShowEdit(true);
                              }}
                            >
                              <FaEdit />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger
                            overlay={<Tooltip>Delete Farmer</Tooltip>}
                          >
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={async () => {
                                const decision = await confirmAction({title:'Delete beneficiary?',message:'The beneficiary will be deleted only if protected operational history does not block the action.',confirmLabel:'Delete beneficiary',tone:'danger',requireReason:true,reasonLabel:'Deletion reason'});
                                if (decision.confirmed) {
                                  const reason = decision.reason;
                                  try {
                                    await axios.delete(`${API_URL}/api/farmers/${farmer._id}`, {
                                      ...auth,
                                      data: { reason },
                                    });
                                    setToast({
                                      show: true,
                                      variant: 'success',
                                      message: 'Farmer deleted successfully',
                                    });
                                    await fetchFarmers();
                                  } catch (error) {
                                    setToast({
                                      show: true,
                                      variant: 'danger',
                                      message: `Failed to delete farmer: ${error.response?.data?.message || error.message}`,
                                    });
                                  }
                                } else {
                                  setToast({
                                    show: true,
                                    variant: 'warning',
                                    message: 'Deletion cancelled: Reason required',
                                  });
                                }
                              }}
                            >
                              <FaTrash />
                            </Button>
                          </OverlayTrigger>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="records-footer">
                  <div className="records-footer__summary">
                    Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> farmers
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
                    <Button variant="outline-secondary" size="sm" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>Previous</Button>
                    <span className="records-footer__page">Page {page} of {Math.max(totalPages, 1)}</span>
                    <Button variant="outline-secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Next</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'installation' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Installation Orders</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={refreshAll}
                  disabled={isLoading}
                >
                  <FaSyncAlt className="me-1" /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="workspace-toolbar"><div className="workspace-search"><span>⌕</span><Form.Control value={installationSearch} onChange={(e)=>setInstallationSearch(e.target.value)} placeholder="Search installation orders…" /></div><Button variant="outline-secondary" onClick={()=>setOpsFiltersOpen('installation')}><FaFilter className="me-1" /> Filters</Button><div className="workspace-toolbar__meta"><strong>{visibleInstallationRecords.length}</strong><span>orders</span></div></div>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Scheme</th>
                      <th>Village</th>
                      <th>Taluka</th>
                      <th>District</th>
                      <th>Surveyor</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleInstallationRecords.map((farmer) => (
                      <tr key={farmer._id}>
                        <td>{farmer.beneficiaryId}</td>
                        <td>{farmer.beneficiaryName}</td>
                        <td>{farmer.mobile}</td>
                        <td>{farmer.scheme}</td>
                        <td>{farmer.village}</td>
                        <td>{farmer.taluka}</td>
                        <td>{farmer.district}</td>
                        <td>{getTechnicianDisplay(farmer.surveyorName)}</td>
                        <td>
                          <Form.Select
                            size="sm"
                            value={farmer.applicationStatus}
                            onChange={(e) => {
                              if (e.target.value === 'Ready for Installation') {
                                setSelectedFarmer(farmer);
                                setShowAssignTechnicianModal(true);
                              } else {
                                handleStatusChange(farmer._id, e.target.value, farmer);
                              }
                            }}
                            disabled={isLoading}
                          >
                            {APPLICATION_STATUSES.filter((s) =>
                              [
                                'Pending Installation',
                                'Move to Installation',
                                'Ordered',
                                'Dispatch Completed',
                                'Ready for Installation',
                                'Installation Completed',
                              ].includes(s)
                            ).map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              setSelectedFarmer(farmer);
                              setShowEdit(true);
                            }}
                          >
                            <FaEdit />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'completed' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Completed Installations</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={refreshAll}
                  disabled={isLoading}
                >
                  <FaSyncAlt className="me-1" /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="workspace-toolbar"><div className="workspace-search"><span>⌕</span><Form.Control value={completedSearch} onChange={(e)=>setCompletedSearch(e.target.value)} placeholder="Search completed installations…" /></div><Button variant="outline-secondary" onClick={()=>setOpsFiltersOpen('completed')}><FaFilter className="me-1" /> Filters</Button><div className="workspace-toolbar__meta"><strong>{visibleCompletedRecords.length}</strong><span>completed</span></div></div>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Scheme</th>
                      <th>Village</th>
                      <th>Taluka</th>
                      <th>District</th>
                      <th>Surveyor</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCompletedRecords.map((farmer) => (
                      <tr key={farmer._id}>
                        <td>{farmer.beneficiaryId}</td>
                        <td>{farmer.beneficiaryName}</td>
                        <td>{farmer.mobile}</td>
                        <td>{farmer.scheme}</td>
                        <td>{farmer.village}</td>
                        <td>{farmer.taluka}</td>
                        <td>{farmer.district}</td>
                        <td>{getTechnicianDisplay(farmer.surveyorName)}</td>
                        <td>{farmer.applicationStatus}</td>
                        <td>
                          {farmer.paymentGivenToSubcontractor
                            ? `${parseFloat(farmer.paymentGivenToSubcontractor).toFixed(2)}`
                            : 'Pending'}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => {
                              setSelectedFarmer(farmer);
                              setPaymentForm({
                                ...farmer,
                                panels: farmer.panels.join(', '),
                                sitePhotos: farmer.sitePhotosUrls.join(', '),
                                finalInspectionStatus: farmer.inspectionStatusFinal || '',
                              });
                              setShowPaymentModal(true);
                            }}
                          >
                            <FaEdit />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'complaints' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Complaints</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={refreshAll}
                  disabled={isLoading}
                >
                  <FaSyncAlt className="me-1" /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="workspace-toolbar"><div className="workspace-search"><span>⌕</span><Form.Control value={complaintSearch} onChange={(e)=>setComplaintSearch(e.target.value)} placeholder="Search complaints…" /></div><Button variant="outline-secondary" onClick={()=>setOpsFiltersOpen('complaints')}><FaFilter className="me-1" /> Filters</Button><div className="workspace-toolbar__meta workspace-toolbar__meta--alert"><strong>{visibleComplaintRecords.length}</strong><span>open</span></div></div>
                <Accordion>
                  {visibleComplaintRecords.map((farmer, index) => (
                    <Accordion.Item eventKey={index.toString()} key={farmer._id}>
                      <Accordion.Header>
                        {farmer.beneficiaryName} ({farmer.beneficiaryId}) - {farmer.complaintIssue || 'No Issue Specified'}
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row>
                          <Col md={6}>
                            <p><strong>Complaint Number:</strong> {farmer.complaintNumber}</p>
                            <p><strong>Raised On:</strong> {farmer.complaintRaisedDate ? new Date(farmer.complaintRaisedDate).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Status:</strong> {farmer.complaintStatus}</p>
                            <p><strong>Assigned Technician:</strong> {getTechnicianDisplay(farmer.reworkAssignTechnician || farmer.surveyorName)}</p>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Rework Required</Form.Label>
                              <Form.Control
                                value={reworkData[farmer._id]?.reWork || ''}
                                onChange={(e) => updateReworkData(farmer._id, 'reWork', e.target.value)}
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Issues</Form.Label>
                              <Form.Control
                                as="textarea"
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
                                  <option key={t.username} value={t.username}>
                                    {getTechnicianDisplay(t.username)}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Rework Assign Date</Form.Label>
                              <Form.Control
                                type="date"
                                value={
                                  reworkData[farmer._id]?.reworkAssignDate
                                    ? new Date(reworkData[farmer._id].reworkAssignDate).toISOString().split('T')[0]
                                    : ''
                                }
                                onChange={(e) => updateReworkData(farmer._id, 'reworkAssignDate', e.target.value)}
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Solution Date</Form.Label>
                              <Form.Control
                                type="date"
                                value={
                                  reworkData[farmer._id]?.solutionDate
                                    ? new Date(reworkData[farmer._id].solutionDate).toISOString().split('T')[0]
                                    : ''
                                }
                                onChange={(e) => updateReworkData(farmer._id, 'solutionDate', e.target.value)}
                              />
                            </Form.Group>
                            <Button
                              variant="primary"
                              onClick={() => handleReworkSubmit(farmer._id)}
                              disabled={isLoading}
                            >
                              Submit Rework
                            </Button>
                          </Col>
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'material-receipts' && !isLoading && (<MaterialReceiptsPanel />)}
          {activeTab === 'rms' && !isLoading && (<AgencyRmsPanel />)}
          {activeTab === 'reports' && !isLoading && (<AgencyReportsPanel />)}

          {activeTab === 'users' && !isLoading && (<AgencyTeamAccessPanel role="admin" />)}

          {activeTab === 'technician-summary' && !isLoading && (
            <Card className="mb-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Technician Summary</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={refreshAll}
                  disabled={isLoading}
                >
                  <FaSyncAlt className="me-1" /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-end mb-3"><Button variant="outline-secondary" size="sm" onClick={() => setFiltersOpen(true)}><FaFilter className="me-1" /> Filters{monthFilter ? ' · 1' : ''}</Button></div>
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
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Technician</th>
                      <th>Mobile</th>
                      <th>Completed Installs</th>
                      <th>Pending Complaints</th>
                      <th>Total Payment Given</th>
                      <th>Total Payment Pending</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicianSummary.map((tech) => {
                      const filteredMonthWise = monthFilter
                        ? tech.monthWise.filter((mw) => mw.month === monthFilter)
                        : tech.monthWise;
                      const totalCompleted = filteredMonthWise.reduce((sum, mw) => sum + mw.count, 0);
                      const totalPaymentGiven = filteredMonthWise.reduce((sum, mw) => sum + mw.paymentGivenSum, 0);
                      const totalPaymentPending = filteredMonthWise.reduce((sum, mw) => sum + mw.paymentPendingSum, 0);
                      return (
                        <tr key={tech.username}>
                          <td>{tech.username}</td>
                          <td>{tech.mobile}</td>
                          <td>{monthFilter ? totalCompleted : tech.totalCompleted}</td>
                          <td>{tech.totalComplaints}</td>
                          <td>{(monthFilter ? totalPaymentGiven : tech.totalPaymentGiven).toFixed(2)}</td>
                          <td>{(monthFilter ? totalPaymentPending : tech.totalPaymentPending).toFixed(2)}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleOpenManagePayments(tech)}
                            >
                              Manage Payments
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Modals */}
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

          <EditFarmerModal
            show={showEdit}
            handleClose={() => {
              setShowEdit(false);
              setSelectedFarmer(null);
            }}
            farmer={selectedFarmer}
            handleSubmit={async (updatedFarmer) => {
              try {
                await axios.put(`${API_URL}/api/farmers/${selectedFarmer._id}`, updatedFarmer, auth);
                setToast({
                  show: true,
                  variant: 'success',
                  message: role === 'superadmin' ? 'Farmer updated successfully' : 'Farmer update request submitted',
                });
                await Promise.all([fetchFarmers(), fetchChangeRequests()]);
                setShowEdit(false);
                setSelectedFarmer(null);
              } catch (error) {
                setToast({
                  show: true,
                  variant: 'danger',
                  message: `Failed to update farmer: ${error.response?.data?.message || error.message}`,
                });
              }
            }}
          />

          <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Update Payment Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handlePaymentSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Beneficiary ID</Form.Label>
                      <Form.Control
                        value={paymentForm.beneficiaryId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, beneficiaryId: e.target.value })}
                        readOnly
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Beneficiary Name</Form.Label>
                      <Form.Control
                        value={paymentForm.beneficiaryName}
                        onChange={(e) => setPaymentForm({ ...paymentForm, beneficiaryName: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>District</Form.Label>
                      <Form.Control
                        value={paymentForm.district}
                        onChange={(e) => setPaymentForm({ ...paymentForm, district: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Taluka</Form.Label>
                      <Form.Control
                        value={paymentForm.taluka}
                        onChange={(e) => setPaymentForm({ ...paymentForm, taluka: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Village</Form.Label>
                      <Form.Control
                        value={paymentForm.village}
                        onChange={(e) => setPaymentForm({ ...paymentForm, village: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Mobile</Form.Label>
                      <Form.Control
                        value={paymentForm.mobile}
                        onChange={(e) => setPaymentForm({ ...paymentForm, mobile: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Aadhar Number</Form.Label>
                      <Form.Control
                        value={paymentForm.aadharNo}
                        onChange={(e) => setPaymentForm({ ...paymentForm, aadharNo: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Pump Type</Form.Label>
                      <Form.Control
                        value={paymentForm.pumpType}
                        onChange={(e) => setPaymentForm({ ...paymentForm, pumpType: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Pump HP</Form.Label>
                      <Form.Control
                        value={paymentForm.pumpHP}
                        onChange={(e) => setPaymentForm({ ...paymentForm, pumpHP: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Controller Type</Form.Label>
                      <Form.Control
                        value={paymentForm.controllerTypeWithOrWithout}
                        onChange={(e) => setPaymentForm({ ...paymentForm, controllerTypeWithOrWithout: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Site Location</Form.Label>
                      <Form.Control
                        value={paymentForm.siteLocation}
                        onChange={(e) => setPaymentForm({ ...paymentForm, siteLocation: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Site Depth</Form.Label>
                      <Form.Control
                        value={paymentForm.siteDepth}
                        onChange={(e) => setPaymentForm({ ...paymentForm, siteDepth: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Actual Head (m)</Form.Label>
                      <Form.Control
                        value={paymentForm.actualHeadM}
                        onChange={(e) => setPaymentForm({ ...paymentForm, actualHeadM: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Survey Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={paymentForm.surveyDate ? new Date(paymentForm.surveyDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, surveyDate: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Surveyor</Form.Label>
                      <Form.Select
                        value={paymentForm.surveyorName}
                        onChange={handleTechnicianChange}
                      >
                        <option value="">Select Surveyor</option>
                        {technicians.map((t) => (
                          <option key={t.username} value={t.username}>
                            {getTechnicianDisplay(t.username)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Inspection Status</Form.Label>
                      <Form.Select
                        value={paymentForm.inspectionStatus}
                        onChange={(e) => setPaymentForm({ ...paymentForm, inspectionStatus: e.target.value })}
                      >
                        {INSPECTION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Final Inspection Status</Form.Label>
                      <Form.Select
                        value={paymentForm.finalInspectionStatus}
                        onChange={(e) => setPaymentForm({ ...paymentForm, finalInspectionStatus: e.target.value })}
                      >
                        <option value="">None</option>
                        {FINAL_INSPECTION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s || 'None'}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>JSR Deviation</Form.Label>
                      <Form.Select
                        value={paymentForm.jsrDeviationYesNo}
                        onChange={(e) => setPaymentForm({ ...paymentForm, jsrDeviationYesNo: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Deviation Remarks</Form.Label>
                      <Form.Control
                        as="textarea"
                        value={paymentForm.deviationRemarks}
                        onChange={(e) => setPaymentForm({ ...paymentForm, deviationRemarks: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Pump No.</Form.Label>
                      <Form.Control
                        value={paymentForm.pumpNoUnique}
                        onChange={(e) => setPaymentForm({ ...paymentForm, pumpNoUnique: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Motor No.</Form.Label>
                      <Form.Control
                        value={paymentForm.motorNoUnique}
                        onChange={(e) => setPaymentForm({ ...paymentForm, motorNoUnique: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Controller No.</Form.Label>
                      <Form.Control
                        value={paymentForm.controllerNoUnique}
                        onChange={(e) => setPaymentForm({ ...paymentForm, controllerNoUnique: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>IMEI No.</Form.Label>
                      <Form.Control
                        value={paymentForm.imeiNoUnique}
                        onChange={(e) => setPaymentForm({ ...paymentForm, imeiNoUnique: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Panels (comma-separated)</Form.Label>
                      <Form.Control
                        value={paymentForm.panels}
                        onChange={(e) => setPaymentForm({ ...paymentForm, panels: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Installation Done</Form.Label>
                      <Form.Select
                        value={paymentForm.installationDoneYesNo}
                        onChange={(e) => setPaymentForm({ ...paymentForm, installationDoneYesNo: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Pump Not Operating</Form.Label>
                      <Form.Select
                        value={paymentForm.pumpNotOperatingYesNo}
                        onChange={(e) => setPaymentForm({ ...paymentForm, pumpNotOperatingYesNo: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Company Assigned Person</Form.Label>
                      <Form.Control
                        value={paymentForm.companyAssignedPersonName}
                        onChange={(e) => setPaymentForm({ ...paymentForm, companyAssignedPersonName: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Charges to Debit</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.chargesToDebit}
                        onChange={(e) => setPaymentForm({ ...paymentForm, chargesToDebit: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Subcontractor Rate</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.subcontractorRate}
                        onChange={(e) => setPaymentForm({ ...paymentForm, subcontractorRate: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Subcontractor Bill</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.subcontractorBill}
                        onChange={(e) => setPaymentForm({ ...paymentForm, subcontractorBill: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Given to Subcontractor</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.paymentGivenToSubcontractor}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentGivenToSubcontractor: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Pending</Form.Label>
                      <Form.Control
                        type="number"
                        value={paymentForm.paymentPending}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentPending: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Farmer Photo URL</Form.Label>
                      <Form.Control
                        value={paymentForm.farmerPhoto}
                        onChange={(e) => setPaymentForm({ ...paymentForm, farmerPhoto: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Farmer Signature URL</Form.Label>
                      <Form.Control
                        value={paymentForm.farmerSignature}
                        onChange={(e) => setPaymentForm({ ...paymentForm, farmerSignature: e.target.value })}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Site Photos (comma-separated URLs)</Form.Label>
                      <Form.Control
                        value={paymentForm.sitePhotos}
                        onChange={(e) => setPaymentForm({ ...paymentForm, sitePhotos: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="primary" type="submit" disabled={isLoading}>
                  Save Payment Details
                </Button>
              </Form>
            </Modal.Body>
          </Modal>

          <Modal show={showAssignTechnicianModal} onHide={() => setShowAssignTechnicianModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Assign Technician</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Technician</Form.Label>
                  <Form.Select
                    value={assignTechnicianForm.surveyorName}
                    onChange={handleAssignTechnicianChange}
                  >
                    <option value="">Select Technician</option>
                    {technicians.map((t) => (
                      <option key={t.username} value={t.username}>
                        {getTechnicianDisplay(t.username)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Reason for Assignment</Form.Label>
                  <Form.Control
                    value={assignTechnicianForm.reason}
                    onChange={(e) => setAssignTechnicianForm({ ...assignTechnicianForm, reason: e.target.value })}
                    placeholder="Enter reason"
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  onClick={() => handleStatusChange(selectedFarmer._id, 'Ready for Installation', selectedFarmer)}
                  disabled={isLoading}
                >
                  Assign and Update Status
                </Button>
              </Form>
            </Modal.Body>
          </Modal>

          <Modal show={showManagePaymentsModal} onHide={() => setShowManagePaymentsModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Manage Payments for {manageTech?.username}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Farmer ID</th>
                    <th>Name</th>
                    <th>Payment Given</th>
                    <th>Payment Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {manageTechFarmers.map((farmer) => (
                    <tr key={farmer._id}>
                      <td>{farmer.beneficiaryId}</td>
                      <td>{farmer.beneficiaryName}</td>
                      <td>
                        <Form.Control
                          type="number"
                          value={farmer.paymentGivenToSubcontractor}
                          onChange={(e) => handleManagePaymentChange(farmer._id, 'paymentGivenToSubcontractor', e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={farmer.paymentPending}
                          onChange={(e) => handleManagePaymentChange(farmer._id, 'paymentPending', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Button variant="primary" onClick={handleSaveManagePayments} disabled={isLoading}>
                Save Payments
              </Button>
            </Modal.Body>
          </Modal>

          <AgencyTechnicianAssignmentModal
            show={!!assignmentFarmer}
            farmer={assignmentFarmer}
            technicians={technicians}
            role="admin"
            onClose={() => setAssignmentFarmer(null)}
            onDone={async (result) => { setAssignmentFarmer(null); setToast({ show: true, variant: 'success', message: result?.message || 'Technician assignment saved.' }); await refreshAll(); }}
          />
        </main>
      </div>
    </Container>
  );
}
