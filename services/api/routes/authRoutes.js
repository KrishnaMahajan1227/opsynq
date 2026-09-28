// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authRateLimit } = require('../middleware/security');

router.post('/login', authRateLimit, authController.login);

module.exports = router;
