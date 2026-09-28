// src/routes/installationRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const installationController = require('../controllers/installationController');

// Define the POST route for complete-installation
router.get('/issued-material/:farmerId', protect, installationController.getMyIssuedMaterial);
router.post('/complete-installation', protect, ...installationController.completeInstallation);

module.exports = router;