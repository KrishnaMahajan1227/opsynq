const router = require('express').Router();
const controller = require('../../controllers/platform/authController');
const { protectPlatform } = require('../../middleware/platform/platformAuth');
router.post('/login', controller.login);
router.post('/register-company', controller.registerCompany);
router.get('/me', protectPlatform, controller.me);
module.exports = router;
