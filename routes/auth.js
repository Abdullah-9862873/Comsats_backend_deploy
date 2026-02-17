const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, resendVerification, forgotPassword, resetPassword } = require('../controllers/authController');
const { validateRegister } = require('../middleware/validate');

// Registration and login routes
router.post('/register', validateRegister, register);
router.post('/login', login);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;