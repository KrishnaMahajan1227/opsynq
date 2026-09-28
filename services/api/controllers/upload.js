const { storage } = require('../config/cloudinary');
const multer = require('multer');

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'));
    }
  },
});

exports.uploadFiles = [
  upload.array('files', 10),
  async (req, res) => {
    try {
      console.log('Received upload request:', {
        files: req.files?.length,
        folder: req.query.folder,
        user: req.user?.id,
        mimetypes: req.files?.map(f => f.mimetype),
      });

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
      }

      const urls = req.files.map((file) => file.path);
      console.log('Files uploaded to Cloudinary:', urls);

      res.json({ urls });
    } catch (err) {
      console.error('Upload error:', {
        message: err.message,
        stack: err.stack,
        folder: req.query.folder,
      });
      res.status(500).json({ message: `Failed to upload files: ${err.message}` });
    }
  },
];