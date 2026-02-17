const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getSupervisorApplications,
  getSupervisorPendingApplications,
  supervisorReviewApplication,
  supervisorRejectWithFeedback,
  studentResubmitApplication,
  supervisorApproveApplication,
  getCompanyApplications,
  getCompanyAcceptedApplications,
  companyReviewApplication,
  getStudentApplications,
  getSupervisors,
  updateApplicationStatus,
  downloadStudentFile,
  previewStudentFile,
  getHiredStudentsForEvaluation,
  scheduleInterview
} = require('../controllers/applicationController');
const { auth, hasRole } = require('../middleware/auth');

// @route   POST /api/applications
// @desc    Submit application for internship
// @access  Private (Student only)
router.post('/', auth, hasRole('student'), submitApplication);

// @route   GET /api/applications/supervisors
// @desc    Get all supervisors
// @access  Private
router.get('/supervisors', auth, getSupervisors);

// @route   GET /api/applications/student
// @desc    Get student's applications
// @access  Private (Student only)
router.get('/student', auth, hasRole('student'), getStudentApplications);

// @route   GET /api/applications/my-applications
// @desc    Get student's applications (alias for /student)
// @access  Private (Student only)
router.get('/my-applications', auth, hasRole('student'), getStudentApplications);

// @route   GET /api/applications/supervisor
// @desc    Get all applications for supervisor's students
// @access  Private (Supervisor only)
router.get('/supervisor', auth, hasRole('supervisor'), getSupervisorApplications);

// @route   GET /api/applications/supervisor/pending
// @desc    Get pending applications for supervisor review
// @access  Private (Supervisor only)
router.get('/supervisor/pending', auth, hasRole('supervisor'), getSupervisorPendingApplications);

// @route   GET /api/applications/supervisor/hired-students
// @desc    Get hired students with offer letter details for evaluations
// @access  Private (Supervisor only)
router.get('/supervisor/hired-students', auth, hasRole('supervisor'), getHiredStudentsForEvaluation);

// @route   PUT /api/applications/:id/supervisor-review
// @desc    Supervisor approve/reject application
// @access  Private (Supervisor only)
router.put('/:id/supervisor-review', auth, hasRole('supervisor'), supervisorReviewApplication);

// @route   PATCH /api/applications/:id/supervisor/reject
// @desc    Supervisor reject application with feedback
// @access  Private (Supervisor only)
router.patch('/:id/supervisor/reject', auth, hasRole('supervisor'), supervisorRejectWithFeedback);

// @route   PATCH /api/applications/:id/resubmit
// @desc    Student resubmit application after fixes
// @access  Private (Student only)
router.patch('/:id/resubmit', auth, hasRole('student'), studentResubmitApplication);

// @route   PATCH /api/applications/:id/supervisor/approve
// @desc    Supervisor approve application after resubmission
// @access  Private (Supervisor only)
router.patch('/:id/supervisor/approve', auth, hasRole('supervisor'), supervisorApproveApplication);

// @route   GET /api/applications/company/pending
// @desc    Get applications for company review (supervisor approved)
// @access  Private (Company only)
router.get('/company/pending', auth, hasRole('company'), getCompanyApplications);

// @route   GET /api/applications/company/accepted
// @desc    Get accepted applications for company (hired students)
// @access  Private (Company only)
router.get('/company/accepted', auth, hasRole('company'), getCompanyAcceptedApplications);

// @route   PUT /api/applications/:id/company-review
// @desc    Company approve/reject application
// @access  Private (Company only)
router.put('/:id/company-review', auth, hasRole('company'), companyReviewApplication);

// @route   PATCH /api/applications/:id/status
// @desc    Update application status (interview flow)
// @access  Private (Company only)
router.patch('/:id/status', auth, hasRole('company'), updateApplicationStatus);

// @route   GET /api/applications/:id/download/:fileType/:fileName
// @desc    Download student file (CV or certificate)
// @access  Private (Supervisor/Company only)
router.get('/:id/download/:fileType/:fileName', auth, downloadStudentFile);

// @route   GET /api/applications/:id/preview/:fileType/:fileName
// @desc    Preview student file (CV or certificate)
// @access  Private (Supervisor/Company only)
router.get('/:id/preview/:fileType/:fileName', auth, previewStudentFile);

// @route   PATCH /api/applications/:id/interview
// @desc    Company schedules interview for student (notifies student & supervisor)
// @access  Private (Company only)
router.patch('/:id/interview', auth, hasRole('company'), scheduleInterview);

module.exports = router;
