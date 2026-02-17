const validateRegister = (req, res, next) => {
  const {
    name,
    email,
    password,
    role,
    companyName,
    industry,
    about,
    department,
    semester,
    regNo,
  } = req.body;

  // Basic validation for all roles
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      message: 'Name, email, password, and role are required',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long',
    });
  }

  if (!['student', 'company', 'supervisor', 'admin'].includes(role)) {
    return res.status(400).json({
      message: 'Invalid role',
    });
  }

  // Role-specific validation
  if (role === 'company') {
    if (!companyName || !industry || !about) {
      return res.status(400).json({
        message: 'Company name, industry, and about are required for company role',
      });
    }
  } else if (role === 'student') {
    if (!department || !semester || !regNo) {
      return res.status(400).json({
        message: 'Department, semester, and registration number are required for student role',
      });
    }
  } else if (role === 'supervisor') {
    if (!department) {
      return res.status(400).json({
        message: 'Department is required for supervisor role',
      });
    }
  }

  next();
};

// Role-based access control middleware
const hasRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No user found.'
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${requiredRole} role required.`
      });
    }

    next();
  };
};

module.exports = { validateRegister, hasRole };