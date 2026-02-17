const express = require('express');
const router = express.Router();
const { 
  submitEvaluation, 
  getCompanyEvaluations, 
  getInternEvaluation, 
  getAllEvaluations,
  generateEvaluationPDF,
  getSupervisorEvaluations 
} = require('../controllers/interneeEvaluationController');
const { auth, isCompany, isStudent, isAdmin, hasRole } = require('../middleware/auth');

// Submit evaluation (company only)
router.post('/submit', 
  auth, 
  isCompany,
  submitEvaluation
);

// Get evaluations submitted by company
router.get('/', 
  auth, 
  hasRole('company'),
  getCompanyEvaluations
);

// Get evaluations for supervisor's students
router.get('/supervisor/evaluations', 
  auth, 
  hasRole('supervisor'),
  getSupervisorEvaluations
);

// Get evaluation for specific intern
router.get('/intern/:internId', 
  auth,
  getInternEvaluation
);

// Get evaluations for students supervised by this supervisor
router.get('/supervisor/evaluations', 
  auth,
  hasRole('supervisor'),
  getSupervisorEvaluations
);

// Generate PDF for evaluation
router.get('/:id/pdf', 
  auth,
  generateEvaluationPDF
);

// Get all evaluations (admin only)
router.get('/admin/all', 
  auth, 
  isAdmin,
  getAllEvaluations
);

module.exports = router;
