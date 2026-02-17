const express = require('express');
const router = express.Router();
const {
  createJob,
  getCompanyJobs,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getCompanyJobStats
} = require('../controllers/jobController');
const { auth, isCompany, hasRole } = require('../middleware/auth');
const { validateJobPost, validateJobUpdate } = require('../middleware/jobValidation');

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private (Company only)
router.post('/', auth, isCompany, validateJobPost, createJob);

// @route   GET /api/jobs/company
// @desc    Get all jobs for authenticated company
// @access  Private (Company only)
router.get('/company', auth, isCompany, getCompanyJobs);

// @route   GET /api/jobs/stats/company
// @desc    Get job statistics for company dashboard
// @access  Private (Company only)
router.get('/stats/company', auth, isCompany, getCompanyJobStats);

// @route   GET /api/jobs
// @desc    Get all active jobs (public access for browsing)
// @access  Public
router.get('/', getAllJobs);

// @route   GET /api/jobs/:id
// @desc    Get single job by ID
// @access  Public
router.get('/:id', getJobById);

// @route   PUT /api/jobs/:id
// @desc    Update job posting
// @access  Private (Company only - own jobs)
router.put('/:id', auth, isCompany, updateJob);

// @route   DELETE /api/jobs/:id
// @desc    Delete job posting
// @access  Private (Company only - own jobs)
router.delete('/:id', auth, isCompany, deleteJob);

module.exports = router;
