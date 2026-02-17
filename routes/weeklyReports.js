const express = require('express');
const router = express.Router();
const weeklyReportController = require('../controllers/weeklyReportController');
const { auth, isSupervisor, isStudent, hasRole } = require('../middleware/auth');
const upload = require('../middleware/weeklyReportUpload');

// ============== STUDENT ROUTES ==============

// Submit a weekly report (Student only)
router.post('/submit',
  auth,
  isStudent,
  upload.array('supportingFiles', 5), // Allow up to 5 files
  weeklyReportController.submitSimpleReport
);

// Get student's submitted weekly reports
router.get('/student/reports',
  auth,
  isStudent,
  weeklyReportController.getStudentReports
);

// ============== SUPERVISOR ROUTES ==============

// Get weekly reports submitted by students under this supervisor
router.get('/supervisor/reports',
  auth,
  isSupervisor,
  weeklyReportController.getSupervisorStudentReports
);

// Add supervisor feedback to a weekly report
router.put('/reports/:reportId/feedback',
  auth,
  isSupervisor,
  weeklyReportController.addSupervisorFeedback
);

// ============== SHARED ROUTES ==============

// Get specific report details
router.get('/reports/:reportId', 
  auth, 
  hasRole('student', 'supervisor', 'admin'), 
  weeklyReportController.getReportDetails
);

// Generate PDF for weekly report
router.get('/reports/:reportId/pdf', 
  auth, 
  hasRole('student', 'supervisor', 'admin'), 
  weeklyReportController.downloadReportPDF
);

// Download supporting file
router.get('/reports/:reportId/files/:fileIndex', 
  auth, 
  hasRole('student', 'supervisor', 'admin'), 
  weeklyReportController.downloadSupportingFile
);

module.exports = router;
