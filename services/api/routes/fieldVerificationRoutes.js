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
  (req, res, next) => upload.fields([
    { name: 'farmerPhoto', maxCount: 1 },
    { name: 'sitePhotos',  maxCount: 10 },
    { name: 'signature',   maxCount: 1 }
  ])(req, res, err => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'One or more images are too large. Please retry; the technician app will optimise them before upload.' });
    }
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. A maximum of 12 verification files is supported.' });
    }
    return res.status(400).json({ message: err.message || 'Invalid verification upload.' });
  }),
  ctl.submitFieldVerification
);

module.exports = router;
