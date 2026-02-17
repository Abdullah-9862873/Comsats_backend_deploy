const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { deleteFile, getFileUrl } = require('../middleware/upload');

// Validation rules
const registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('department').notEmpty().withMessage('Department is required'),
  body('semester').notEmpty().withMessage('Semester is required')
];

const profileUpdateValidation = [
  body('cgpa').optional().isFloat({ min: 0, max: 4.0 }).withMessage('CGPA must be between 0.0 and 4.0'),
  body('phoneNumber').optional().custom((value) => {
    if (value && value.trim() !== '') {
      // Allow various phone number formats
      const phoneRegex = /^[+]?[0-9\s\-\(\)]{7,15}$/;
      if (!phoneRegex.test(value)) {
        throw new Error('Valid phone number is required');
      }
    }
    return true;
  }),
  body('rollNumber').optional().custom((value) => {
    if (value && value.trim() === '') {
      throw new Error('Roll number cannot be empty');
    }
    return true;
  }),
  body('attendance').optional().isInt({ min: 0, max: 100 }).withMessage('Attendance must be between 0 and 100'),
  body('backlogs').optional().isInt({ min: 0 }).withMessage('Backlogs must be a non-negative number')
];

// Register new student
const registerStudent = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullName, email, password, department, semester } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new student
    const student = new Student({
      fullName,
      email,
      password: hashedPassword,
      department,
      semester
    });

    await student.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, email: student.email, role: student.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: {
        student: student.toSafeObject(),
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Student login
const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find student by email
    const student = await Student.findOne({ email, isActive: true });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, email: student.email, role: student.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        student: student.toSafeObject(),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student profile
const getStudentProfile = async (req, res) => {
  try {
    let studentData;
    
    // If student data is already attached by middleware, use it
    if (req.student) {
      studentData = req.student;
      
      // For User model users, we need to ensure we get the actual Student record
      if (req.user.isFromUserModel && typeof studentData._id === 'string') {
        // The middleware provides virtual data, but we need the actual Student record for updates
        const actualStudent = await Student.findOne({ email: req.user.email }).populate('selectedSupervisorId');
        if (actualStudent) {
          studentData = actualStudent;
        }
      }
    } else {
      // Fallback: fetch student by ID or email
      let student;
      
      if (req.user.isFromUserModel) {
        // For User model users, find by email
        student = await Student.findOne({ email: req.user.email }).populate('selectedSupervisorId');
      } else {
        // For direct Student model users, find by ID
        student = await Student.findById(req.user.id).populate('selectedSupervisorId');
      }
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      studentData = student;
    }

    // Convert to plain object for manipulation
    const studentObject = studentData.toObject ? studentData.toObject() : studentData;
    
    // Remove password if it exists
    delete studentObject.password;
    
    // Add file URLs to the response with validation
    if (studentObject.profilePicture) {
      const profileUrl = getFileUrl(req, studentObject.profilePicture);
      if (profileUrl) {
        studentObject.profilePictureUrl = profileUrl;
      } else {
        // File doesn't exist, clean up the reference
        studentObject.profilePicture = null;
        studentObject.profilePictureUrl = null;
      }
    }
    if (studentObject.cv && studentObject.cv.path) {
      const cvUrl = getFileUrl(req, studentObject.cv.path);
      if (cvUrl) {
        studentObject.cv.url = cvUrl;
      } else {
        // File doesn't exist, clean up the reference
        studentObject.cv = {
          filename: null,
          originalName: null,
          path: null,
          size: null,
          uploadedAt: null,
          url: null
        };
      }
    }
    if (studentObject.certificates && studentObject.certificates.length > 0) {
      studentObject.certificates = studentObject.certificates
        .map(cert => {
          const certUrl = getFileUrl(req, cert.path);
          if (certUrl) {
            return {
              ...cert,
              url: certUrl
            };
          }
          return null; // Mark for removal if file doesn't exist
        })
        .filter(cert => cert !== null); // Remove null entries
    }

    // Calculate profile completion percentage if not available
    if (!studentObject.profileCompletionPercentage) {
      let completed = 0;
      const totalFields = 8;
      
      if (studentObject.profilePicture) completed++;
      if (studentObject.cgpa !== null && studentObject.cgpa !== undefined) completed++;
      if (studentObject.phoneNumber) completed++;
      if (studentObject.rollNumber) completed++;
      if (studentObject.attendance !== null && studentObject.attendance !== undefined) completed++;
      if (studentObject.backlogs !== null && studentObject.backlogs !== undefined) completed++;
      if (studentObject.cv && studentObject.cv.filename) completed++;
      if (studentObject.certificates && studentObject.certificates.length > 0) completed++;
      
      studentObject.profileCompletionPercentage = Math.round((completed / totalFields) * 100);
    }

    // Transform selectedSupervisorId to selectedSupervisor for frontend compatibility
    if (studentObject.selectedSupervisorId) {
      const supervisor = studentObject.selectedSupervisorId;
      
      // Debug logging to understand supervisor data structure
      console.log('=== SUPERVISOR DATA DEBUG ===');
      console.log('Supervisor ID:', supervisor._id);
      console.log('Supervisor name:', supervisor.name);
      console.log('Supervisor email:', supervisor.email);
      console.log('Supervisor role:', supervisor.role);
      console.log('Supervisor.supervisor object:', supervisor.supervisor);
      console.log('Full supervisor object keys:', Object.keys(supervisor));
      console.log('Supervisor object type:', typeof supervisor);
      console.log('Is supervisor an ObjectId?', supervisor.constructor.name);
      
      // Check if supervisor is just an ObjectId (population failed)
      if (supervisor.constructor.name === 'ObjectId' || (typeof supervisor === 'object' && Object.keys(supervisor).length === 0)) {
        console.log('❌ POPULATION FAILED - supervisor is just an ObjectId or empty object');
        console.log('Attempting to manually fetch supervisor...');
        
        // Try to manually fetch the supervisor
        const User = require('../models/User');
        const manualSupervisor = await User.findById(supervisor._id || supervisor);
        
        if (manualSupervisor) {
          console.log('✅ Manual fetch successful:');
          console.log('  Name:', manualSupervisor.name);
          console.log('  Email:', manualSupervisor.email);
          console.log('  Role:', manualSupervisor.role);
          console.log('  Has profile:', !!manualSupervisor.supervisor);
          
          // Use the manually fetched supervisor data
          const supervisorProfile = manualSupervisor.supervisor || {};
          
          studentObject.selectedSupervisor = {
            _id: manualSupervisor._id,
            id: manualSupervisor._id,
            name: manualSupervisor.name || 'Name not available',
            email: manualSupervisor.email || 'Email not available',
            department: supervisorProfile.department || 'Department not specified',
            designation: supervisorProfile.designation || 'Designation not specified', 
            maxStudents: supervisorProfile.maxStudents || 10,
            currentStudents: supervisorProfile.currentStudents || 0,
            expertise: supervisorProfile.expertise || [],
            phone: supervisorProfile.phone || 'Phone not specified',
            office: supervisorProfile.office || 'Office not specified',
            officeHours: supervisorProfile.officeHours || 'Office hours not specified'
          };
        } else {
          console.log('❌ Manual fetch also failed - supervisor does not exist in User collection');
          studentObject.selectedSupervisor = null;
        }
      } else {
        console.log('✅ Population successful, processing normal supervisor data');
        if (supervisor.supervisor) {
          console.log('Supervisor department:', supervisor.supervisor.department);
          console.log('Supervisor designation:', supervisor.supervisor.designation);
          console.log('Supervisor phone:', supervisor.supervisor.phone);
          console.log('Supervisor office:', supervisor.supervisor.office);
        } else {
          console.log('No supervisor profile data found in supervisor.supervisor');
        }
        
        // Create selectedSupervisor object with proper fallbacks
        const supervisorProfile = supervisor.supervisor || {};
        
        studentObject.selectedSupervisor = {
          _id: supervisor._id,
          id: supervisor._id,
          name: supervisor.name || 'Name not available',
          email: supervisor.email || 'Email not available',
          department: supervisorProfile.department || 'Department not specified',
          designation: supervisorProfile.designation || 'Designation not specified', 
          maxStudents: supervisorProfile.maxStudents || 10,
          currentStudents: supervisorProfile.currentStudents || 0,
          expertise: supervisorProfile.expertise || [],
          phone: supervisorProfile.phone || 'Phone not specified',
          office: supervisorProfile.office || 'Office not specified',
          officeHours: supervisorProfile.officeHours || 'Office hours not specified'
        };
      }
      
      console.log('==============================');
    } else {
      studentObject.selectedSupervisor = null;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: studentObject
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update student profile
const updateStudentProfile = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const studentId = req.user.id;
    const updateData = {};

    // Extract editable fields from request body
    const { cgpa, phoneNumber, rollNumber, attendance, backlogs, selectedSupervisorId, codeOfConduct } = req.body;

    if (cgpa !== undefined) updateData.cgpa = cgpa;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
    if (attendance !== undefined) updateData.attendance = attendance;
    if (backlogs !== undefined) updateData.backlogs = backlogs;
    if (selectedSupervisorId !== undefined) updateData.selectedSupervisorId = selectedSupervisorId;
    if (codeOfConduct !== undefined) updateData.codeOfConduct = codeOfConduct;

    // Find the student - use the attached student data or fetch fresh
    let student = req.student;
    if (!student || req.user.isFromUserModel) {
      if (req.user.isFromUserModel) {
        // For User model users, find by email
        student = await Student.findOne({ email: req.user.email });
      } else {
        // For direct Student model users, find by ID
        student = await Student.findById(req.user.id);
      }
      
      if (!student && req.user.isFromUserModel) {
        // If no student found, create one
        const User = require('../models/User');
        const userData = await User.findById(req.user.id);
        
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
        
        student = new Student({
          fullName: userData.name,
          email: userData.email,
          password: userData.password, // Use the existing password from User model
          department: departmentMapping[userData.student?.department] || departmentMapping[userData.department] || 'Computer Science',
          semester: semesterMapping[userData.student?.semester] || semesterMapping[userData.semester] || '5th',
          rollNumber: userData.student?.regNo || null,
          profilePicture: userData.avatar !== 'https://example.com/default-avatar.jpg' ? userData.avatar : null,
          isActive: true,
          // Set defaults for new fields
          cgpa: null,
          phoneNumber: null,
          attendance: null,
          backlogs: 0,
          codeOfConduct: false
        });
        
        await student.save();
      }
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
    }

    // Handle file uploads
    if (req.files) {
      // Handle profile picture
      if (req.files.profilePicture) {
        // Delete old profile picture if exists
        if (student.profilePicture) {
          deleteFile(student.profilePicture);
        }
        updateData.profilePicture = req.files.profilePicture[0].path;
      }

      // Handle CV upload
      if (req.files.cv) {
        // Delete old CV if exists
        if (student.cv && student.cv.path) {
          deleteFile(student.cv.path);
        }
        const cvFile = req.files.cv[0];
        updateData.cv = {
          filename: cvFile.filename,
          originalName: cvFile.originalname,
          path: cvFile.path,
          size: cvFile.size,
          uploadedAt: new Date()
        };
      }

      // Handle certificates upload
      if (req.files.certificates) {
        const newCertificates = req.files.certificates.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          uploadedAt: new Date()
        }));
        
        // Add to existing certificates
        updateData.certificates = [...(student.certificates || []), ...newCertificates];
      }
    }

    // Update the student
    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      updateData,
      { new: true, runValidators: true }
    ).populate('selectedSupervisorId', 'name email supervisor');

    // Prepare response with file URLs and validation
    const responseData = updatedStudent.toObject();
    delete responseData.password;
    
    if (responseData.profilePicture) {
      const profileUrl = getFileUrl(req, responseData.profilePicture);
      if (profileUrl) {
        responseData.profilePictureUrl = profileUrl;
      } else {
        responseData.profilePicture = null;
        responseData.profilePictureUrl = null;
      }
    }
    if (responseData.cv && responseData.cv.path) {
      const cvUrl = getFileUrl(req, responseData.cv.path);
      if (cvUrl) {
        responseData.cv.url = cvUrl;
      } else {
        responseData.cv = {
          filename: null,
          originalName: null,
          path: null,
          size: null,
          uploadedAt: null,
          url: null
        };
      }
    }
    if (responseData.certificates && responseData.certificates.length > 0) {
      responseData.certificates = responseData.certificates
        .map(cert => {
          const certUrl = getFileUrl(req, cert.path);
          if (certUrl) {
            return {
              ...cert,
              url: certUrl
            };
          }
          return null;
        })
        .filter(cert => cert !== null);
    }

    // Transform selectedSupervisorId to selectedSupervisor for frontend compatibility
    if (responseData.selectedSupervisorId) {
      const supervisor = responseData.selectedSupervisorId;
      responseData.selectedSupervisor = {
        _id: supervisor._id,
        id: supervisor._id,
        name: supervisor.name,
        email: supervisor.email,
        department: supervisor.supervisor?.department || 'Not specified',
        designation: supervisor.supervisor?.designation || 'Supervisor',
        maxStudents: supervisor.supervisor?.maxStudents || 10,
        currentStudents: supervisor.supervisor?.currentStudents || 0,
        expertise: supervisor.supervisor?.expertise || [],
        phone: supervisor.supervisor?.phone || '',
        office: supervisor.supervisor?.office || '',
        officeHours: supervisor.supervisor?.officeHours || ''
      };
    } else {
      responseData.selectedSupervisor = null;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle duplicate key error for rollNumber
    if (error.code === 11000 && error.keyPattern && error.keyPattern.rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Roll number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete certificate
const deleteCertificate = async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentEmail = req.user.email;
    const { certificateId } = req.params;

    console.log('🗑️ Delete certificate request:', { studentId, studentEmail, certificateId });

    // First try to find student in the Student model by ID
    let student = await Student.findById(studentId);
    
    // If not found by ID, try to find by email (for User model students)
    if (!student) {
      console.log('🗑️ Student not found by ID, searching by email:', studentEmail);
      student = await Student.findOne({ email: studentEmail });
    }
    
    // If still not found, check if this is a User model student
    if (!student) {
      const User = require('../models/User');
      const user = await User.findOne({ _id: studentId, role: 'student' });
      
      if (!user) {
        console.log('🗑️ User not found in User model');
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      console.log('🗑️ Found user in User model, no certificates available for deletion');
      return res.status(404).json({
        success: false,
        message: 'No certificates found for this student'
      });
    }

    console.log('🗑️ Found student:', { id: student._id, email: student.email, certificatesCount: student.certificates.length });

    // Find the certificate to delete
    const certificateIndex = student.certificates.findIndex(
      cert => cert._id.toString() === certificateId
    );

    if (certificateIndex === -1) {
      console.log('🗑️ Certificate not found:', certificateId);
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Delete the file from disk
    const certificate = student.certificates[certificateIndex];
    console.log('🗑️ Deleting certificate:', { id: certificate._id, name: certificate.originalName, path: certificate.path });
    deleteFile(certificate.path);

    // Remove from array
    student.certificates.splice(certificateIndex, 1);
    await student.save();

    console.log('🗑️ Certificate deleted successfully');
    res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully'
    });

  } catch (error) {
    console.error('🗑️ Delete certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all students (for admin/supervisor dashboard)
const getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      semester,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const students = await Student.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Student.countDocuments(filter);

    // Add file URLs to each student
    const studentsWithUrls = students.map(student => {
      const studentData = student.toObject();
      if (studentData.profilePicture) {
        studentData.profilePictureUrl = getFileUrl(req, studentData.profilePicture);
      }
      return studentData;
    });

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: {
        students: studentsWithUrls,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: students.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student statistics
const getStudentStats = async (req, res) => {
  try {
    const stats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          completedProfiles: { $sum: { $cond: ['$profileCompleted', 1, 0] } },
          avgCGPA: { $avg: '$cgpa' },
          avgAttendance: { $avg: '$attendance' },
          totalBacklogs: { $sum: '$backlogs' }
        }
      }
    ]);

    const departmentStats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          avgCGPA: { $avg: '$cgpa' },
          avgAttendance: { $avg: '$attendance' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const semesterStats = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 },
          avgCGPA: { $avg: '$cgpa' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Student statistics retrieved successfully',
      data: {
        overview: stats[0] || {
          totalStudents: 0,
          completedProfiles: 0,
          avgCGPA: 0,
          avgAttendance: 0,
          totalBacklogs: 0
        },
        byDepartment: departmentStats,
        bySemester: semesterStats
      }
    });

  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check student eligibility for internship applications
const checkEligibility = async (req, res) => {
  try {
    // Find student - handle both Student model and User model users
    let student;
    
    if (req.user.isFromUserModel) {
      // For User model users, find by email
      student = await Student.findOne({ email: req.user.email });
      
      if (!student) {
        // If no Student record exists, return default eligibility status for User model users
        return res.status(200).json({
          success: true,
          message: 'Eligibility checked successfully',
          data: {
            eligible: false,
            requirements: {
              cgpa: { met: false, value: null },
              semester: { met: false, value: null },
              backlogs: { met: false, value: null },
              attendance: { met: false, value: null },
              codeOfConduct: { met: false, value: false }
            },
            unmetRequirements: [
              'Complete your profile to check eligibility',
              'CGPA is required',
              'Semester information is required',
              'Backlogs information is required',
              'Attendance is required',
              'Must acknowledge Code of Conduct'
            ]
          }
        });
      }
    } else {
      // For direct Student model users, find by ID
      student = await Student.findById(req.user.id);
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Use the static method from the model to check eligibility
    const eligibilityResult = Student.checkEligibility({
      cgpa: student.cgpa,
      semester: student.semester,
      backlogs: student.backlogs,
      attendance: student.attendance,
      codeOfConduct: student.codeOfConduct
    });

    // Update student's eligibility status in database
    await Student.findByIdAndUpdate(student._id, {
      isEligible: eligibilityResult.eligible,
      eligibilityDetails: eligibilityResult.requirements
    });

    res.status(200).json({
      success: true,
      message: 'Eligibility checked successfully',
      data: {
        eligible: eligibilityResult.eligible,
        requirements: eligibilityResult.requirements,
        unmetRequirements: eligibilityResult.unmetRequirements
      }
    });

  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  getStudentProfile,
  updateStudentProfile,
  deleteCertificate,
  getAllStudents,
  getStudentStats,
  checkEligibility,
  registerValidation,
  profileUpdateValidation
};
