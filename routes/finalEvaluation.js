const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const finalEvaluationController = require('../controllers/finalEvaluationController');

// Supervisor routes
router.get('/supervisor/final-evaluations', auth, finalEvaluationController.getFinalEvaluations);
router.post('/supervisor/send-result/:applicationId', auth, finalEvaluationController.sendFinalResult);
router.get('/supervisor/view-sent-result/:applicationId', auth, finalEvaluationController.viewSentResult);

// Student routes
router.get('/student/result', auth, finalEvaluationController.getStudentResult);

module.exports = router;
