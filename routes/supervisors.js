const express = require('express');
const router = express.Router();
const {
  getSupervisorProfile,
  updateSupervisorProfile,
  getAllSupervisors,
  syncStudentCounts,
  getDashboardStats
} = require('../controllers/supervisorController');
const { auth } = require('../middleware/auth');
const { hasRole } = require('../middleware/validate');

// @route   GET /api/supervisors
// @desc    Get all supervisors
// @access  Private
router.get('/', auth, getAllSupervisors);

// @route   GET /api/supervisors/profile
// @desc    Get supervisor profile
// @access  Private (Supervisor only)
router.get('/profile', auth, hasRole('supervisor'), getSupervisorProfile);

// @route   PUT /api/supervisors/profile
// @desc    Update supervisor profile
// @access  Private (Supervisor only)
router.put('/profile', auth, hasRole('supervisor'), updateSupervisorProfile);

// @route   GET /api/supervisors/dashboard-stats
// @desc    Get supervisor dashboard statistics
// @access  Private (Supervisor only)
router.get('/dashboard-stats', auth, hasRole('supervisor'), getDashboardStats);

// @route   POST /api/supervisors/sync-counts
// @desc    Sync supervisor student counts
// @access  Private (Admin only) 
router.post('/sync-counts', auth, hasRole('admin'), syncStudentCounts);

module.exports = router;
