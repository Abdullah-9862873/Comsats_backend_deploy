const express = require('express');
const router = express.Router();
const { auth, hasRole } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/internshipReportUpload');
const {
  createInternshipReport,
  getStudentInternshipReport,
  getSupervisorInternshipReports,
  addSupervisorFeedback,
  getInternshipReportById,
  downloadAppendixFile,
  checkInternshipReportEligibility,
  generateInternshipReportPDF
} = require('../controllers/internshipReportController');

// Student routes
router.post('/submit', auth, hasRole('student'), uploadMiddleware, createInternshipReport);
router.get('/student', auth, hasRole('student'), getStudentInternshipReport);
router.get('/eligibility', auth, hasRole('student'), checkInternshipReportEligibility);

// Supervisor routes
router.get('/supervisor', auth, hasRole('supervisor'), getSupervisorInternshipReports);
router.put('/:reportId/feedback', auth, hasRole('supervisor'), addSupervisorFeedback);

// Common routes
router.get('/:reportId', auth, getInternshipReportById);
router.get('/:reportId/pdf', auth, generateInternshipReportPDF);
router.get('/:reportId/files/:fileIndex', auth, downloadAppendixFile);

module.exports = router;
