const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing Cloudinary environment variables:', missingEnvVars.join(', '));
  throw new Error(`Missing Cloudinary configuration: ${missingEnvVars.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedFolders = [
  'Opsynq/Order_Received/LR_Photos',
  'Opsynq/Order_Received/Signatures',
  'Opsynq/Inspection_Photos/Profiles',
  'Opsynq/Inspection_Photos',
  'Opsynq/Inspection_Photos/Signatures',
  'Opsynq/Installation_Photos/Profiles',
  'Opsynq/Installation_Photos',
  'Opsynq/Installation_Photos/Signatures',
];

const uploadFolder = req => {
  if (req.query.folder && allowedFolders.includes(req.query.folder)) return req.query.folder;
  if (req.query.folder) console.warn('Rejected unsupported upload folder.');
  return 'Opsynq/Other';
};

// Existing survey/installation fields are intentionally image-only.
const storage = new CloudinaryStorage({
  cloudinary,
  params: async req => ({
    folder: uploadFolder(req),
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'image',
  }),
});

// Company evidence can include a PDF declaration/document. This storage is used
// only by the governed evidence upload endpoint; operational photo fields keep
// the stricter image-only storage above.
const evidenceStorage = new CloudinaryStorage({
  cloudinary,
  params: async req => ({
    folder: uploadFolder(req),
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto',
  }),
});

module.exports = { cloudinary, storage, evidenceStorage };
