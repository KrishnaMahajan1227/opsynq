const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Validate environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing Cloudinary environment variables:', missingEnvVars.join(', '));
  throw new Error(`Missing Cloudinary configuration: ${missingEnvVars.join(', ')}`);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    console.log('Cloudinary upload params:', {
      fieldname: file.fieldname,
      queryFolder: req.query.folder,
      originalname: file.originalname,
    });

    let folder = 'Opsynq/Other';
    if (req.query.folder) {
      const validFolders = [
        'Opsynq/Order_Received/LR_Photos',
        'Opsynq/Order_Received/Signatures',
        'Opsynq/Inspection_Photos/Profiles',
        'Opsynq/Inspection_Photos',
        'Opsynq/Inspection_Photos/Signatures',
        'Opsynq/Installation_Photos/Profiles',
        'Opsynq/Installation_Photos',
        'Opsynq/Installation_Photos/Signatures',
      ];
      if (validFolders.includes(req.query.folder)) {
        folder = req.query.folder;
      } else {
        console.warn('Invalid folder specified:', req.query.folder);
      }
    }

    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png'],
      resource_type: 'image',
    };
  },
});

module.exports = { cloudinary, storage };