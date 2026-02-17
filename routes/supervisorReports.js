const express = require('express');
const router = express.Router();
const {
  createSupervisorReport,
  getSupervisorReports,
  getCompanyReports,
  markReportAsRead
} = require('../controllers/supervisorReportController');
const { auth, hasRole } = require('../middleware/auth');

// @route   POST /api/supervisor-reports
// @desc    Create a new supervisor report
// @access  Private (Company only)
router.post('/', auth, hasRole('company'), createSupervisorReport);

// @route   GET /api/supervisor-reports/:supervisorId
// @desc    Get reports for a specific supervisor
// @access  Private (Supervisor only)
router.get('/:supervisorId', auth, getSupervisorReports);

// @route   GET /api/supervisor-reports/company/:companyId
// @desc    Get reports created by a specific company
// @access  Private (Company only)
router.get('/company/:companyId', auth, getCompanyReports);

// @route   PATCH /api/supervisor-reports/:reportId/read
// @desc    Mark report as read
// @access  Private (Supervisor only)
router.patch('/:reportId/read', auth, markReportAsRead);

module.exports = router;
