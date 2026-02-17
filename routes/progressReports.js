const express = require('express');
const router = express.Router();
const { auth, hasRole } = require('../middleware/auth');
const {
  createProgressReport,
  getCompanyReports,
  getSupervisorReports,
  reviewReport,
  downloadProgressReportPDF,
  getReportById
} = require('../controllers/progressReportController');

// Create progress report (Company only)
router.post('/create', auth, hasRole('company'), createProgressReport);

// Get company's progress reports (Company only)
router.get('/company/:companyId', auth, hasRole('company'), getCompanyReports);

// Get supervisor's progress reports (Supervisor only)
router.get('/supervisor', auth, hasRole('supervisor'), getSupervisorReports);

// Review progress report (Supervisor only)
router.patch('/:reportId/review', auth, hasRole('supervisor'), reviewReport);

// Download progress report PDF
router.get('/:reportId/pdf', auth, downloadProgressReportPDF);

// Get progress report by ID
router.get('/:reportId', auth, getReportById);

module.exports = router;