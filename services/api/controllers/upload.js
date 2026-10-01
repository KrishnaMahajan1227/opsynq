const { evidenceStorage } = require('../config/cloudinary');
const multer = require('multer');

const upload = multer({
  storage: evidenceStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed.'));
  },
});

exports.uploadFiles = (req, res) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      const tooLarge = err instanceof multer.MulterError && ['LIMIT_FILE_SIZE', 'LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'].includes(err.code);
      const status = tooLarge ? 413 : (err instanceof multer.MulterError ? 400 : 502);
      console.error('Upload error:', err.message);
      return res.status(status).json({
        message: tooLarge
          ? 'Upload is too large. Reduce the number or file size and try again.'
          : `Failed to upload files: ${err.message}`,
        code: err.code || 'UPLOAD_FAILED',
      });
    }
    if (!req.files?.length) return res.status(400).json({ message: 'No files uploaded.' });
    return res.json({ urls: req.files.map((file) => file.path) });
  });
};
