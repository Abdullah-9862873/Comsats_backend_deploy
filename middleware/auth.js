const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔍 AUTH MIDDLEWARE DEBUG:');
    console.log('   Authorization header:', req.header('Authorization'));
    console.log('   Extracted token:', token ? 'EXISTS (length: ' + token.length + ')' : 'NOT FOUND');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('   Decoded token:', decoded);
    console.log('   Has id field?', decoded.id ? 'YES (' + decoded.id + ')' : 'NO');
    console.log('   Has userId field?', decoded.userId ? 'YES (' + decoded.userId + ')' : 'NO');
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    console.log('   User lookup result:', user ? 'FOUND (' + user.name + ')' : 'NOT FOUND');
    
    if (!user) {
      console.log('❌ Token is not valid - user not found');
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Middleware to check if user is a company
const isCompany = (req, res, next) => {
  if (req.user && req.user.role === 'company') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Company account required.'
    });
  }
};

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Student account required.'
    });
  }
};

// Middleware to check if user is a supervisor
const isSupervisor = (req, res, next) => {
  if (req.user && req.user.role === 'supervisor') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Supervisor account required.'
    });
  }
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin account required.'
    });
  }
};

// Middleware to check multiple roles
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
  };
};

// Combined middleware for company authentication and authorization
const ensureCompany = [auth, isCompany];

module.exports = {
  auth,
  isCompany,
  isStudent,
  isSupervisor,
  isAdmin,
  hasRole,
  ensureCompany
};
