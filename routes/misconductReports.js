const express = require('express');
const router = express.Router();
const { auth, hasRole } = require('../middleware/auth');
const {
  createMisconductReport,
  getSupervisedStudents,
  getEligibleStudents,
  getCompanyReports,
  getSupervisorReports,
  getStudentReports,
  updateReportStatus,
  getReportById
} = require('../controllers/misconductReportController');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Misconduct routes working' });
});

// Create misconduct report (Company only)
router.post('/create', auth, hasRole('company'), createMisconductReport);

// Get students with offer letters (Company only)
router.get('/students', auth, hasRole('company'), getSupervisedStudents);

// Get eligible hired students for misconduct reports (Company only)
router.get('/eligible-students/:companyId', auth, hasRole('company'), getEligibleStudents);

// Get company's misconduct reports (Company only)
router.get('/company/:companyId', auth, hasRole('company'), getCompanyReports);

// Get student's misconduct reports (Student only)
router.get('/student/:studentId', auth, hasRole('student'), getStudentReports);

// Get misconduct reports for supervisor (Supervisor only)
router.get('/supervisor', auth, hasRole('supervisor'), getSupervisorReports);

// Update report status (Supervisor only)
router.patch('/:reportId/status', auth, hasRole('supervisor'), updateReportStatus);

// Get report by ID
router.get('/:reportId', auth, getReportById);

module.exports = router;