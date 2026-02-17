const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/profiles',
    'uploads/cvs',
    'uploads/certificates',
    'uploads/chat-attachments'
  ];
  
  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      // In serverless environments (like Vercel), filesystem is read-only
      // This is expected and we can continue without creating directories
      console.warn(`⚠️ Could not create directory ${dir}: ${err.message}`);
    }
  });
};

// Initialize upload directories (silently fail in serverless)
createUploadDirs();

// Storage configuration for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `profile_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Storage configuration for CVs
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/cvs/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `cv_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Storage configuration for certificates
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certificates/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `cert_${req.user.id}_${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter for profile pictures (images only)
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF) are allowed for profile pictures'), false);
  }
};

// File filter for CVs (PDF and DOC files only)
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

// File filter for certificates (PDF, DOC, and image files)
const certificateFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, and image files are allowed for certificates'), false);
  }
};

// Multer configurations
const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

const uploadCV = multer({
  storage: cvStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

const uploadCertificates = multer({
  storage: certificateStorage,
  fileFilter: certificateFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  }
});

// Combined upload for profile update (handles multiple file types)
const uploadProfileData = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'profilePicture') {
        cb(null, 'uploads/profiles/');
      } else if (file.fieldname === 'cv') {
        cb(null, 'uploads/cvs/');
      } else if (file.fieldname === 'certificates') {
        cb(null, 'uploads/certificates/');
      } else {
        cb(new Error('Invalid field name'), false);
      }
    },
    filename: (req, file, cb) => {
      let uniqueName;
      if (file.fieldname === 'profilePicture') {
        uniqueName = `profile_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
      } else if (file.fieldname === 'cv') {
        uniqueName = `cv_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
      } else if (file.fieldname === 'certificates') {
        uniqueName = `cert_${req.user.id}_${Date.now()}_${file.originalname}`;
      }
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
      imageFilter(req, file, cb);
    } else if (file.fieldname === 'cv') {
      documentFilter(req, file, cb);
    } else if (file.fieldname === 'certificates') {
      certificateFilter(req, file, cb);
    } else {
      cb(new Error('Invalid field name'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files total
  }
});

// Helper function to delete old files
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper function to get file URL with validation
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  
  // Check if file actually exists
  const fs = require('fs');
  const path = require('path');
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ Warning: File referenced but not found: ${filePath}`);
    return null; // Return null if file doesn't exist
  }
  
  return `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/')}`;
};

// Storage configuration for chat attachments
const chatAttachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chat-attachments/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `chat_${req.user.id}_${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter for chat attachments (various file types)
const chatAttachmentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'text/plain'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed for chat attachments'), false);
  }
};

// General upload configuration (used for chat attachments)
const upload = multer({
  storage: chatAttachmentStorage,
  fileFilter: chatAttachmentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Maximum 5 files per message
  }
});

module.exports = {
  uploadProfile,
  uploadCV,
  uploadCertificates,
  uploadProfileData,
  upload, // General upload for chat attachments
  deleteFile,
  getFileUrl
};
