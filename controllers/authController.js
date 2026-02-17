const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const emailService = require('../services/emailService');
const FakeEmailDetector = require('../services/fakeEmailDetector');

const fakeEmailDetector = new FakeEmailDetector();

const register = async (req, res) => {
  const { name, email, password, role, companyName, industry, website, about, department, semester, regNo, designation } = req.body;

  try {
    // Check for fake/temporary email addresses
    const emailCheck = fakeEmailDetector.checkEmail(email);
    if (emailCheck.isFake) {
      console.log(`🚫 Fake email detected: ${email} - ${emailCheck.reason}`);
      return res.status(400).json({ 
        success: false,
        message: 'Registration blocked: Fake or temporary email addresses are not allowed.',
        error: 'FAKE_EMAIL_DETECTED',
        reason: emailCheck.reason,
        confidence: emailCheck.confidence
      });
    }

    console.log(`✅ Email verified as legitimate: ${email} (confidence: ${emailCheck.confidence}%)`);

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user based on role
    user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
      lastVerificationEmailSent: new Date(),
      ...(role === 'student' && { student: { department, semester, regNo } }),
      ...(role === 'supervisor' && { supervisor: { department, designation } }),
    });

    await user.save();

    // Create CompanyProfile for company users
    if (role === 'company') {
      const companyProfile = new CompanyProfile({
        user: user._id,
        companyName: companyName || name, // Use name as fallback
        industry: industry || '',
        website: website || '',
        about: about || '',
        status: 'pending' // Requires admin approval
      });
      
      await companyProfile.save();
      console.log('✅ Created CompanyProfile for:', companyName || name);
    }

    // Send verification email
    try {
      console.log(`📧 Sending verification email to ${user.email} (${user.role})`);
      const emailResult = await emailService.sendVerificationEmail(user, verificationToken);
      if (emailResult.success) {
        console.log('✅ Verification email sent successfully');
      } else {
        console.log('⚠️ Verification email failed:', emailResult.error);
      }
    } catch (emailError) {
      // Log email error but don't fail the registration
      console.error('❌ Email service error:', emailError);
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar || 'https://example.com/default-avatar.jpg',
      },
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check email verification
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check company approval status for company users
    if (user.role === 'company') {
      const companyProfile = await CompanyProfile.findOne({ user: user._id });
      if (!companyProfile) {
        return res.status(403).json({
          message: 'Company profile not found. Please contact support.',
          requiresApproval: true
        });
      }
      
      if (companyProfile.status === 'pending') {
        return res.status(403).json({
          message: 'Your company registration is pending admin approval. Please wait for admin to review and approve your company before you can login.',
          requiresApproval: true,
          companyStatus: 'pending'
        });
      }
      
      if (companyProfile.status === 'rejected') {
        return res.status(403).json({
          message: 'Your company registration has been rejected by admin. Please contact support for more information.',
          requiresApproval: true,
          companyStatus: 'rejected'
        });
      }
    }

    // Check if user is inactive
    if (user.status === 'inactive') {
      return res.status(403).json({
        message: 'Your account has been marked as inactive by the administrator due to prolonged inactivity. Please contact the admin to reactivate your account.',
        accountStatus: 'inactive'
      });
    }

    // Update last login time
    await User.findByIdAndUpdate(user._id, { 
      lastLogin: new Date(),
      lastActivity: new Date()
    });

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar || 'https://example.com/default-avatar.jpg',
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Email verification handler
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // First, check if user is already verified with this token pattern
    const alreadyVerifiedUser = await User.findOne({
      email: { $exists: true },
      isVerified: true
    });

    // If we can find the user by reconstructing from token data, check if already verified
    // This is a more graceful way to handle double verification attempts

    // Find user with this verification token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
      isVerified: false
    });

    if (!user) {
      // Check if maybe the user is already verified
      const verifiedUser = await User.findOne({
        $or: [
          { verificationToken: token },
          { isVerified: true }
        ]
      });

      if (verifiedUser && verifiedUser.isVerified) {
        // User is already verified - this is likely a double API call
        return res.status(200).json({
          success: true,
          message: 'Email already verified successfully!',
          user: {
            id: verifiedUser._id,
            name: verifiedUser.name,
            email: verifiedUser.email,
            role: verifiedUser.role,
            isVerified: verifiedUser.isVerified
          }
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Send welcome email after verification
    try {
      console.log(`📧 Sending welcome email to verified user: ${user.email}`);
      const welcomeEmailResult = await emailService.sendWelcomeEmail(user);
      if (welcomeEmailResult.success) {
        console.log('✅ Welcome email sent successfully');
      } else {
        console.log('⚠️ Welcome email failed:', welcomeEmailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Welcome email error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to COMSATS Internship Portal.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

// Resend verification email handler
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check for fake/temporary email addresses
    const emailCheck = fakeEmailDetector.checkEmail(email);
    if (emailCheck.isFake) {
      console.log(`🚫 Fake email detected in resend request: ${email} - ${emailCheck.reason}`);
      return res.status(400).json({ 
        success: false,
        message: 'Verification blocked: Fake or temporary email addresses are not allowed.',
        error: 'FAKE_EMAIL_DETECTED',
        reason: emailCheck.reason
      });
    }

    // Find unverified user
    const user = await User.findOne({
      email: email.toLowerCase(),
      isVerified: false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Check rate limiting (max 1 email per 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (user.lastVerificationEmailSent && user.lastVerificationEmailSent > fiveMinutesAgo) {
      const timeLeft = Math.ceil((user.lastVerificationEmailSent.getTime() + 5 * 60 * 1000 - Date.now()) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Please wait ${timeLeft} minute(s) before requesting another verification email`
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    user.lastVerificationEmailSent = new Date();
    await user.save();

    // Send verification email
    try {
      console.log(`📧 Resending verification email to: ${user.email}`);
      const emailResult = await emailService.sendVerificationEmail(user, verificationToken);
      
      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email'
        });
      }

      console.log('✅ Verification email resent successfully');
    } catch (emailError) {
      console.error('❌ Resend email error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully! Please check your inbox.',
      expiresAt: verificationTokenExpires
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending verification email'
    });
  }
};

// Forgot password - send reset email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before requesting a password reset.'
      });
    }

    // Rate limiting: Check if a reset email was sent recently (5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (user.lastPasswordResetEmailSent && user.lastPasswordResetEmailSent > fiveMinutesAgo) {
      const waitTime = Math.ceil((user.lastPasswordResetEmailSent - fiveMinutesAgo) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitTime} minute(s) before requesting another password reset email`
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    user.lastPasswordResetEmailSent = new Date();
    await user.save();

    // Send reset email
    try {
      console.log(`🔑 Sending password reset email to ${user.email} (${user.role})`);
      const emailResult = await emailService.sendPasswordResetEmail(user, resetToken);
      if (emailResult.success) {
        console.log('✅ Password reset email sent successfully');
      } else {
        console.log('⚠️ Password reset email failed:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Email service error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
      resetLinkSent: true
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing password reset request'
    });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.lastPasswordResetEmailSent = undefined;
    await user.save();

    // Send confirmation email (optional)
    try {
      console.log(`✅ Password reset successful for ${user.email} (${user.role})`);
      // You could send a password changed confirmation email here
    } catch (emailError) {
      console.error('❌ Email confirmation error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password'
    });
  }
};

module.exports = { register, login, verifyEmail, resendVerification, forgotPassword, resetPassword };