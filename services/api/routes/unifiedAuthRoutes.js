const express = require('express');
const router = express.Router();
const controller = require('../controllers/unifiedAuthController');
const { authRateLimit, recoveryRateLimit } = require('../middleware/security');

router.post('/login', authRateLimit, controller.login);
router.post('/agency-handoff/exchange', authRateLimit, controller.exchangeAgencyHandoff);
router.post('/forgot-password', recoveryRateLimit, controller.forgotPassword);
router.post('/reset-password/validate', recoveryRateLimit, controller.validateResetToken);
router.post('/reset-password', recoveryRateLimit, controller.resetPassword);

module.exports = router;
