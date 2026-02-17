const express = require('express');
const router = express.Router();
const {
  submitSupervisorEvaluation,
  getSupervisorEvaluations,
  getAllSupervisorEvaluations,
  getEvaluationById,
  updateEvaluationStatus
} = require('../controllers/supervisorEvaluationController');
const { auth, hasRole } = require('../middleware/auth');

// Submit supervisor evaluation (Supervisor only)
router.post('/submit', auth, hasRole('supervisor'), submitSupervisorEvaluation);

// Get supervisor's evaluations (Supervisor only)
router.get('/supervisor', auth, hasRole('supervisor'), getSupervisorEvaluations);

// Get all evaluations (Admin only)
router.get('/admin/all', auth, hasRole('admin'), getAllSupervisorEvaluations);

// Get evaluation by ID
router.get('/:id', auth, getEvaluationById);

// Update evaluation status (Admin/Supervisor only)
router.patch('/:id/status', auth, updateEvaluationStatus);

module.exports = router;
