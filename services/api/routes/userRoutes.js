const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Register new user (only superadmin)
router.post(
  '/register',
  protect,
  authorizeRoles('admin','superadmin'),
  userController.register
);

// Update existing user (only superadmin)
router.put(
  '/update/:id',
  protect,
  authorizeRoles('admin','superadmin'),
  userController.update
);

// Delete user (only superadmin)
router.delete(
  '/:id',
  protect,
  authorizeRoles('superadmin'),
  userController.delete
);

// Get all users (only superadmin)
router.get(
  '/',
  protect,
  authorizeRoles('admin','superadmin'),
  userController.getUsers
);

// ─── NEW: Get currently authenticated user’s profile ────────────────────────
router.get('/revision', protect, userController.getRealtimeRevision);

router.get(
  '/me',
  protect,
  userController.getMyProfile
);
router.post(
  '/me/location',
  protect,
  userController.updateMyLocation
);


router.get(
  '/technicians',
  protect,
  authorizeRoles('admin', 'superadmin'),
  userController.getTechnicians
);

module.exports = router;
