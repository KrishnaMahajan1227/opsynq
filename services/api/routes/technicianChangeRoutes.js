const express = require('express');
const router = express.Router();
const technicianChangeController = require('../controllers/technicianChangeController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Create a new technician change request (Admin only)
router.post(
  '/request',
  protect,
  authorizeRoles('admin'),
  technicianChangeController.createChangeRequest
);

// Get all change requests (SuperAdmin only)
router.get(
  '/all',
  protect,
  authorizeRoles('superadmin'),
  technicianChangeController.getAllChangeRequests
);

// Get my change requests (Admin only)
router.get(
  '/my-requests',
  protect,
  authorizeRoles('admin'),
  technicianChangeController.getMyChangeRequests
);

// Review a change request (SuperAdmin only)
router.put(
  '/review/:requestId',
  protect,
  authorizeRoles('superadmin'),
  technicianChangeController.reviewChangeRequest
);

// Get pending requests count (SuperAdmin only)
router.get(
  '/pending-count',
  protect,
  authorizeRoles('superadmin'),
  technicianChangeController.getPendingRequestsCount
);

module.exports = router;