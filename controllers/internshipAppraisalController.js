const mongoose = require('mongoose');
const InternshipAppraisal = require('../models/InternshipAppraisal');
const Application = require('../models/Application');
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const Job = require('../models/Job');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/appraisals');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'appraisal-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Get eligible students for appraisal (hired students)
const getEligibleStudentsForAppraisal = async (req, res) => {
  try {
    console.log('=== GET ELIGIBLE STUDENTS FOR APPRAISAL ===');
    console.log('Company ID:', req.user.id);
    
    const companyUserId = req.user.id;
    
    // Find all hired applications for this company
    const hiredApplications = await Application.find({
      companyId: companyUserId,
      applicationStatus: 'hired'
    })
    .populate('studentId', 'name email student.regNo')
    .populate('jobId', 'title duration')
    .sort({ updatedAt: -1 });

    console.log('Found hired applications:', hiredApplications.length);

    // Format the response data - add null checks
    const eligibleStudents = hiredApplications
      .filter(application => application.studentId) // Filter out applications with null studentId
      .map(application => ({
        _id: application.studentId._id,
        name: application.studentId.name,
        email: application.studentId.email,
        internshipTitle: application.jobId?.title || 'N/A',
        duration: application.jobId?.duration || 'N/A',
        applicationId: application._id,
        jobId: application.jobId?._id
      }));

    // Remove duplicates based on student ID
    const uniqueStudents = eligibleStudents.filter((student, index, self) =>
      index === self.findIndex(s => s._id.toString() === student._id.toString())
    );

    console.log('Unique eligible students:', uniqueStudents.length);

    res.json({
      success: true,
      data: uniqueStudents
    });

  } catch (error) {
    console.error('Get eligible students for appraisal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible students',
      error: error.message
    });
  }
};

// Create internship appraisal
const createInternshipAppraisal = async (req, res) => {
  try {
    console.log('=== CREATE INTERNSHIP APPRAISAL ===');
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    const {
      studentId,
      internshipTitle,
      duration,
      overallPerformance,
      rating,
      keyStrengths,
      areasForImprovement,
      commentsAndFeedback,
      recommendation
    } = req.body;

    const companyUserId = req.user.id;

    // Validate required fields
    if (!studentId || !overallPerformance || !rating || !keyStrengths || 
        !areasForImprovement || !commentsAndFeedback || !recommendation) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 10) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 10'
      });
    }

    // Verify that this company has hired this student
    const hiredApplication = await Application.findOne({
      companyId: companyUserId,
      studentId: studentId,
      applicationStatus: 'hired'
    });

    if (!hiredApplication) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or not hired by this company'
      });
    }

    // Get student information
    const studentUser = await User.findById(studentId);
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Student user not found'
      });
    }

    // Get company information
    const companyUser = await User.findById(companyUserId);
    if (!companyUser) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get company profile for additional details
    const companyProfile = await CompanyProfile.findOne({ user: companyUserId });
    const companyName = companyProfile?.companyName || companyUser.name || 'Unknown Company';

    // Process file attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    // Create the appraisal report
    const appraisal = new InternshipAppraisal({
      studentId,
      studentName: studentUser.name,
      rollNumber: studentUser.student?.regNo || 'N/A',
      internshipTitle: internshipTitle || 'N/A',
      duration: duration || 'N/A',
      companyId: companyUserId,
      companyName: companyName,
      overallPerformance,
      rating: parseInt(rating),
      keyStrengths,
      areasForImprovement,
      commentsAndFeedback,
      recommendation,
      attachments,
      submittedBy: companyUser.name,
      submittedByEmail: companyUser.email
    });

    await appraisal.save();
    console.log('Appraisal saved successfully:', appraisal._id);

    res.status(201).json({
      success: true,
      message: 'Internship appraisal created successfully',
      data: appraisal
    });

  } catch (error) {
    console.error('Create internship appraisal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create internship appraisal',
      error: error.message
    });
  }
};

// Get company's appraisal reports
const getCompanyAppraisals = async (req, res) => {
  try {
    console.log('=== GET COMPANY APPRAISALS ===');
    const companyUserId = req.user.id;
    
    const appraisals = await InternshipAppraisal.find({ companyId: companyUserId })
      .populate('studentId', 'name email student.regNo')
      .sort({ submissionDate: -1 });

    console.log('Found appraisals:', appraisals.length);

    // Update roll numbers from Student model to ensure accurate data
    const Student = require('../models/Student');
    const appraisalsWithCorrectData = await Promise.all(
      appraisals.map(async (appraisal) => {
        const appraisalObj = appraisal.toObject();
        try {
          // Get student profile to fetch roll number
          if (appraisal.studentId && appraisal.studentId.email) {
            const student = await Student.findOne({ email: appraisal.studentId.email });
            if (student && student.rollNumber) {
              appraisalObj.rollNumber = student.rollNumber;
            }
          }
        } catch (err) {
          console.error('Error fetching student data for appraisal:', err);
        }
        return appraisalObj;
      })
    );

    res.json({
      success: true,
      data: appraisalsWithCorrectData
    });

  } catch (error) {
    console.error('Get company appraisals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appraisals',
      error: error.message
    });
  }
};

// Get appraisal by ID
const getAppraisalById = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const companyUserId = req.user.id;

    const appraisal = await InternshipAppraisal.findOne({
      _id: appraisalId,
      companyId: companyUserId
    }).populate('studentId', 'name email student.regNo');

    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal not found'
      });
    }

    res.json({
      success: true,
      data: appraisal
    });

  } catch (error) {
    console.error('Get appraisal by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appraisal',
      error: error.message
    });
  }
};

// Update appraisal status
const updateAppraisalStatus = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const { status } = req.body;
    const companyUserId = req.user.id;

    const appraisal = await InternshipAppraisal.findOneAndUpdate(
      { _id: appraisalId, companyId: companyUserId },
      { status },
      { new: true }
    );

    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal not found'
      });
    }

    res.json({
      success: true,
      message: 'Appraisal status updated successfully',
      data: appraisal
    });

  } catch (error) {
    console.error('Update appraisal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appraisal status',
      error: error.message
    });
  }
};

// Delete appraisal
const deleteAppraisal = async (req, res) => {
  try {
    const { appraisalId } = req.params;
    const companyUserId = req.user.id;

    const appraisal = await InternshipAppraisal.findOneAndDelete({
      _id: appraisalId,
      companyId: companyUserId
    });

    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal not found'
      });
    }

    // Delete associated files
    if (appraisal.attachments && appraisal.attachments.length > 0) {
      appraisal.attachments.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.json({
      success: true,
      message: 'Appraisal deleted successfully'
    });

  } catch (error) {
    console.error('Delete appraisal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appraisal',
      error: error.message
    });
  }
};

// Get supervisor's appraisals
const getSupervisorAppraisals = async (req, res) => {
  try {
    console.log('=== GET SUPERVISOR APPRAISALS ===');
    const supervisorId = req.user.id;
    console.log('🔐 Supervisor ID:', supervisorId);
    
    // CRITICAL SECURITY FIX: Only fetch appraisals for students supervised by this supervisor
    const Application = require('../models/Application');
    
    // Find all applications where this supervisor is assigned
    const supervisedApplications = await Application.find({
      supervisorId: supervisorId
    }).select('studentId');
    
    const supervisedStudentIds = supervisedApplications.map(app => app.studentId.toString());
    
    console.log(`📋 Supervisor has ${supervisedStudentIds.length} supervised students`);
    
    // Only fetch appraisals for supervised students
    const appraisals = await InternshipAppraisal.find({
      studentId: { $in: supervisedStudentIds }
    })
    .populate('studentId', 'name email student.regNo')
    .sort({ submissionDate: -1 });

    console.log('✅ Found appraisals for supervised students:', appraisals.length);
    console.log('Sample appraisal:', appraisals[0]);

    // Update company names from CompanyProfile to ensure they show the 3rd step registration name
    const appraisalsWithCorrectNames = await Promise.all(
      appraisals.map(async (appraisal) => {
        const appraisalObj = appraisal.toObject();
        try {
          const companyProfile = await CompanyProfile.findOne({ user: appraisal.companyId });
          if (companyProfile && companyProfile.companyName) {
            appraisalObj.companyName = companyProfile.companyName;
          }
        } catch (err) {
          console.error('Error fetching company profile for appraisal:', err);
        }
        return appraisalObj;
      })
    );

    res.json({
      success: true,
      data: appraisalsWithCorrectNames
    });

  } catch (error) {
    console.error('Get supervisor appraisals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supervisor appraisals',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  getEligibleStudentsForAppraisal,
  createInternshipAppraisal,
  getCompanyAppraisals,
  getSupervisorAppraisals,
  getAppraisalById,
  updateAppraisalStatus,
  deleteAppraisal
};
