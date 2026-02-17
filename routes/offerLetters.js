const express = require('express');
const router = express.Router();
const {
  sendOfferLetter,
  getCompanyOfferLetters,
  getStudentOfferLetters,
  getSupervisorOfferLetters,
  getOfferLetterById,
  downloadOfferLetter,
  respondToOffer
} = require('../controllers/offerLetterController');
const { auth, hasRole } = require('../middleware/auth');

// @route   POST /api/offer-letters/test
// @desc    Test endpoint
// @access  Private (Company only)
router.post('/test', auth, hasRole('company'), (req, res) => {
  res.json({ success: true, message: 'Test endpoint working', user: req.user });
});

// @route   POST /api/offer-letters/send
// @desc    Send offer letter to student
// @access  Private (Company only)
router.post('/send', auth, hasRole('company'), (req, res, next) => {
  console.log('=== ROUTE MIDDLEWARE ===');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('User ID:', req.user?.id);
  next();
}, sendOfferLetter);

// @route   GET /api/offer-letters/company
// @desc    Get company's sent offer letters
// @access  Private (Company only)
router.get('/company', auth, hasRole('company'), getCompanyOfferLetters);

// @route   GET /api/offer-letters/student
// @desc    Get student's received offer letters
// @access  Private (Student only)
router.get('/student', auth, hasRole('student'), getStudentOfferLetters);

// @route   GET /api/offer-letters/supervisor
// @desc    Get supervisor's students' offer letters
// @access  Private (Supervisor only)
router.get('/supervisor', auth, hasRole('supervisor'), getSupervisorOfferLetters);

// @route   GET /api/offer-letters/:id/download
// @desc    Download offer letter as PDF
// @access  Private
router.get('/:id/download', auth, downloadOfferLetter);

// @route   GET /api/offer-letters/:id
// @desc    Get offer letter by ID
// @access  Private (Student/Company)
router.get('/:id', auth, getOfferLetterById);

// @route   PATCH /api/offer-letters/:id/respond
// @desc    Student respond to offer letter (accept/reject)
// @access  Private (Student only)
router.patch('/:id/respond', auth, hasRole('student'), respondToOffer);

module.exports = router;