const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  getCompanyProfile, 
  updateCompanyProfile, 
  uploadProfileImage, 
  uploadDocument, 
  deleteDocument,
  addCertification,
  deleteCertification 
} = require('../controllers/companyProfileController');
const { ensureCompany } = require('../middleware/auth');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    'uploads/profiles',
    'uploads/banners',
    'uploads/company-documents'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }
  });
};

ensureUploadDirs();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (req.route.path.includes('logo')) {
      uploadPath = 'uploads/profiles';
    } else if (req.route.path.includes('banner')) {
      uploadPath = 'uploads/banners';
    } else {
      uploadPath = 'uploads/company-documents';
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'image') {
      // For images (logo/banner)
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for logo/banner'), false);
      }
    } else {
      // For documents
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type for document'), false);
      }
    }
  }
});

// Routes
router.get('/', ensureCompany, getCompanyProfile);
router.put('/', ensureCompany, updateCompanyProfile);
router.post('/upload/logo', ensureCompany, upload.single('image'), uploadProfileImage);
router.post('/upload/banner', ensureCompany, upload.single('image'), uploadProfileImage);
router.post('/upload/document', ensureCompany, upload.single('document'), uploadDocument);
router.delete('/document/:documentId', ensureCompany, deleteDocument);
router.post('/certification', ensureCompany, addCertification);
router.delete('/certification/:certificationId', ensureCompany, deleteCertification);

module.exports = router;