// src/routes/fieldVerificationRoutes.js
const express     = require('express');
const multer      = require('multer');
const { protect } = require('../middleware/authMiddleware');
const ctl         = require('../controllers/fieldVerificationController');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage, limits:{fileSize:8*1024*1024,files:12} });
const router = express.Router();

// POST /api/field-verification/:id
router.post(
  '/:id',
  protect,
  upload.fields([
    { name: 'farmerPhoto', maxCount: 1 },
    { name: 'sitePhotos',  maxCount: 10 },
    { name: 'signature',   maxCount: 1 }
  ]),
  ctl.submitFieldVerification
);

module.exports = router;
