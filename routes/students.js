const express = require('express');
const router = express.Router();
const {
  registerStudent,
  loginStudent,
  getStudentProfile,
  updateStudentProfile,
  deleteCertificate,
  getAllStudents,
  getStudentStats,
  checkEligibility,
  registerValidation,
  profileUpdateValidation
} = require('../controllers/studentController');
const {
  authenticateStudent,
  requireStudent,
  authenticateAdminOrSupervisor,
  handleUploadError
} = require('../middleware/studentAuth');
const { authenticateStudentUnified } = require('../middleware/unifiedAuth');
const { uploadProfileData } = require('../middleware/upload');

// Public routes (no authentication required)
router.post('/register', registerValidation, registerStudent);
router.post('/login', loginStudent);

// Protected routes (authentication required)
router.use(authenticateStudentUnified);

// Get student profile
router.get('/profile', getStudentProfile);

// Update student profile with file uploads
router.put('/profile', 
  uploadProfileData.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'certificates', maxCount: 5 }
  ]),
  handleUploadError,
  profileUpdateValidation,
  updateStudentProfile
);

// Delete specific certificate
router.delete('/certificates/:certificateId', authenticateStudentUnified, deleteCertificate);

// Check eligibility for internship applications
router.get('/eligibility', checkEligibility);

// CV Builder routes
router.get('/cv-data', require('../controllers/cvController').getCVData);
router.post('/cv-data', require('../controllers/cvController').saveCVData);

// Admin/Supervisor routes (separate authentication)
router.get('/all', authenticateAdminOrSupervisor, getAllStudents);
router.get('/stats', authenticateAdminOrSupervisor, getStudentStats);

module.exports = router;
