const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const uploadController = require('../controllers/upload');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const agencyReportController = require('../controllers/agencyReportController');

// File Upload Routes
router.post('/upload', protect, uploadController.uploadFiles);
router.get('/template/:type', protect, authorizeRoles('admin', 'superadmin'), farmerController.downloadExcelTemplate);
router.post('/uploadExcel', protect, authorizeRoles('admin', 'superadmin'), farmerController.uploadExcel);
router.post('/uploadJsrExcel', protect, authorizeRoles('admin', 'superadmin'), farmerController.uploadJsrExcel);

// Agency-scoped reporting
router.get('/reports', protect, authorizeRoles('admin', 'superadmin'), agencyReportController.catalog);
router.get('/reports/:type/preview', protect, authorizeRoles('admin', 'superadmin'), agencyReportController.preview);
router.get('/reports/:type/export', protect, authorizeRoles('admin', 'superadmin'), agencyReportController.export);

// Audit and User Data Routes
router.get('/audit-logs', protect, authorizeRoles('admin', 'superadmin'), farmerController.getAuditLogs);
router.get('/users', protect, authorizeRoles('admin', 'superadmin'), farmerController.getUsers);

// Change Request Management
router.get('/requests', protect, authorizeRoles('superadmin'),  farmerController.getAllRequests);
router.get('/change-requests', protect, farmerController.getChangeRequests);
router.post('/change-requests/:id/approve', protect, authorizeRoles('superadmin'), farmerController.approveChangeRequest);
router.post('/change-requests/:id/reject', protect, authorizeRoles('superadmin'), farmerController.rejectChangeRequest);

// Farmer Routes
router.get('/', protect, farmerController.getFarmers);
router.get('/detail-context/:id', protect, farmerController.getFarmerDetailContext);
router.post('/:id/evidence/:requirementId', protect, farmerController.submitFarmerEvidence);
router.post('/:id/assign-technician', protect, authorizeRoles('admin','superadmin'), farmerController.assignTechnician);
router.get('/:id', protect, farmerController.getFarmerById);
router.put('/:id', protect, authorizeRoles('admin','superadmin'), farmerController.updateFarmer);
router.delete('/:id', protect, authorizeRoles('admin','superadmin'), farmerController.deleteFarmer);
router.post('/bulk-update', protect, authorizeRoles('admin','superadmin'), farmerController.bulkUpdateFarmers);

module.exports = router;