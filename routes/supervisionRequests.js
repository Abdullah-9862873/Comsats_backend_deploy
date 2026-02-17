const express = require('express');
const router = express.Router();
const {
  createSupervisionRequest,
  getStudentSupervisionRequests,
  getSupervisorSupervisionRequests,
  updateSupervisionRequestStatus
} = require('../controllers/supervisionRequestController');
const { authenticateStudentUnified, authenticateAdminOrSupervisor } = require('../middleware/unifiedAuth');

// @route   POST /api/supervision-requests
// @desc    Create a new supervision request
// @access  Private (Student only)
router.post('/', authenticateStudentUnified, createSupervisionRequest);

// @route   GET /api/supervision-requests/student
// @desc    Get student's supervision requests
// @access  Private (Student only)
router.get('/student', authenticateStudentUnified, getStudentSupervisionRequests);

// @route   GET /api/supervision-requests/supervisor
// @desc    Get supervisor's pending supervision requests
// @access  Private (Supervisor only)
router.get('/supervisor', authenticateAdminOrSupervisor, getSupervisorSupervisionRequests);

// @route   PATCH /api/supervision-requests/:requestId
// @desc    Update supervision request status (Accept/Reject)
// @access  Private (Supervisor only)
router.patch('/:requestId', authenticateAdminOrSupervisor, updateSupervisionRequestStatus);

module.exports = router;
