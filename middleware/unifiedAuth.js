const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const User = require('../models/User');

// Unified middleware to authenticate students from both User and Student models
const authenticateStudentUnified = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let student = null;
    let isFromUserModel = false;

    // First, try to find in the new Student model
    student = await Student.findById(decoded.id).select('-password');
    
    // If not found in Student model, try the User model with role 'student'
    if (!student) {
      const user = await User.findOne({ 
        _id: decoded.id, 
        role: 'student' 
      }).select('-password');
      
      if (user) {
        isFromUserModel = true;
        
        // Department mapping
        const departmentMapping = {
          'computer-science': 'Computer Science',
          'software-engineering': 'Software Engineering',
          'information-technology': 'Information Technology',
          'electrical-engineering': 'Electrical Engineering',
          'mechanical-engineering': 'Mechanical Engineering',
          'civil-engineering': 'Civil Engineering',
          'business-administration': 'Business Administration',
          'management-sciences': 'Management Sciences',
          'mathematics': 'Mathematics',
          'physics': 'Physics',
          'chemistry': 'Chemistry'
        };

        // Semester mapping
        const semesterMapping = {
          '1': '1st',
          '2': '2nd',
          '3': '3rd',
          '4': '4th',
          '5': '5th',
          '6': '6th',
          '7': '7th',
          '8': '8th'
        };
        
        // Convert User model data to Student-like structure
        student = {
          _id: user._id,
          fullName: user.name,
          email: user.email,
          department: departmentMapping[user.student?.department] || departmentMapping[user.department] || 'Computer Science',
          semester: semesterMapping[user.student?.semester] || semesterMapping[user.semester] || '1st',
          role: user.role,
          // Map other fields if they exist
          rollNumber: user.student?.regNo || '',
          isActive: true, // Assume active if from User model
          // Set defaults for fields that don't exist in User model
          cgpa: null,
          phoneNumber: null,
          attendance: null,
          backlogs: null,
          profilePicture: user.avatar !== 'https://example.com/default-avatar.jpg' ? user.avatar : null,
          profilePictureUrl: user.avatar,
          cv: null,
          certificates: [],
          profileCompleted: false,
          profileCompletionPercentage: 25, // Basic info from User model
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      }
    }

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Student not found.'
      });
    }

    // Check if student is active (only for Student model)
    if (!isFromUserModel && student.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Add student info to request with a flag indicating the source
    req.user = {
      id: student._id,
      email: student.email,
      role: student.role || 'student',
      fullName: student.fullName,
      isFromUserModel: isFromUserModel
    };

    // Don't attach virtual student data - let controllers fetch actual records
    if (!isFromUserModel) {
      req.student = student; // Only attach for direct Student model users
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Middleware to check if user is a student
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student role required.'
    });
  }
  next();
};

// Middleware to migrate user from User model to Student model if needed
const migrateUserToStudent = async (req, res, next) => {
  try {
    // Only migrate if the user comes from the User model
    if (req.user.isFromUserModel) {
      // Check if student already exists in Student model
      let existingStudent = await Student.findOne({ email: req.user.email });
      
      if (!existingStudent) {
        // Get the full user data
        const user = await User.findById(req.user.id);
        
        // Department mapping
        const departmentMapping = {
          'computer-science': 'Computer Science',
          'software-engineering': 'Software Engineering',
          'information-technology': 'Information Technology',
          'electrical-engineering': 'Electrical Engineering',
          'mechanical-engineering': 'Mechanical Engineering',
          'civil-engineering': 'Civil Engineering',
          'business-administration': 'Business Administration',
          'management-sciences': 'Management Sciences',
          'mathematics': 'Mathematics',
          'physics': 'Physics',
          'chemistry': 'Chemistry'
        };

        // Semester mapping
        const semesterMapping = {
          '5': '5th',
          '6': '6th',
          '7': '7th',
          '8': '8th'
        };
        
        // Create new student record
        const newStudent = new Student({
          fullName: user.name,
          email: user.email,
          password: user.password, // Copy the hashed password
          department: departmentMapping[user.student?.department] || departmentMapping[user.department] || 'Computer Science',
          semester: semesterMapping[user.student?.semester] || semesterMapping[user.semester] || '5th',
          rollNumber: user.student?.regNo || null,
          profilePicture: user.avatar !== 'https://example.com/default-avatar.jpg' ? user.avatar : null,
          // Set defaults for new fields
          cgpa: null,
          phoneNumber: null,
          attendance: null,
          backlogs: 0,
          cv: null,
          certificates: [],
          isActive: true
        });

        await newStudent.save();
        
        // Update the request with the new student data
        req.student = newStudent;
        req.user.id = newStudent._id;
        req.user.isFromUserModel = false;
        
        console.log(`Migrated student ${user.email} from User to Student model`);
      } else {
        // Use existing student record
        req.student = existingStudent;
        req.user.id = existingStudent._id;
        req.user.isFromUserModel = false;
      }
    }
    
    next();
  } catch (error) {
    console.error('Migration error:', error);
    // Continue without migration on error
    next();
  }
};

// Middleware to handle file upload errors
const handleUploadError = (error, req, res, next) => {
  if (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (error.message.includes('Only')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'File upload error.',
      error: error.message
    });
  }
  next();
};

// Unified authentication middleware that supports role-based access
const unifiedAuth = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }
      
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if the user's role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired.'
        });
      }
      
      console.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authentication.'
      });
    }
  };
};

module.exports = {
  authenticateStudentUnified,
  requireStudent,
  migrateUserToStudent,
  handleUploadError,
  unifiedAuth,
  // Export old functions for backward compatibility
  authenticateStudent: authenticateStudentUnified,
  authenticateAdminOrSupervisor: async (req, res, next) => {
    try {
      const authHeader = req.header('Authorization');
      const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      if (!['admin', 'supervisor'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin or Supervisor role required.'
        });
      }

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired.'
        });
      }
      
      console.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authentication.'
      });
    }
  }
};
