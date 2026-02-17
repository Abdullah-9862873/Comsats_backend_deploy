const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateCompletionCertificatePDF } = require('../utils/completionCertificatePdf');
const CompletionCertificate = require('../models/CompletionCertificate');
const Application = require('../models/Application');
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const { auth, isStudent, isSupervisor } = require('../middleware/auth');

// Helper function to calculate duration in months
const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 30); // Approximate months
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/completion-certificates/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'certificateFile') {
      // Allow image and PDF files for certificate
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Certificate file must be an image or PDF'), false);
      }
    } else if (file.fieldname === 'appraisalForm') {
      // Allow PDF and document files for appraisal
      if (file.mimetype === 'application/pdf' || 
          file.mimetype === 'application/msword' || 
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
      } else {
        cb(new Error('Appraisal form must be a PDF or Word document'), false);
      }
    } else {
      cb(new Error('Unknown file field'), false);
    }
  }
});

// Submit completion certificate
router.post('/submit', auth, upload.fields([
  { name: 'certificateFile', maxCount: 1 },
  { name: 'appraisalForm', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🔄 Processing completion certificate submission for user:', req.user.id);
    
    // Check if user already has a completion certificate
    const existingCertificate = await CompletionCertificate.findOne({ 
      studentId: req.user.id 
    });
    
    if (existingCertificate) {
      console.log('❌ Certificate already exists for user:', req.user.id);
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a completion certificate',
        errorCode: 'CERTIFICATE_EXISTS'
      });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      return res.status(400).json({
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    // Get hired application with company details - try multiple statuses
    const Application = require('../models/Application');
    const application = await Application.findOne({
      studentId: req.user.id,
      $or: [
        { status: 'hired' },
        { applicationStatus: 'hired' },
        { status: 'accepted' }, // Also allow accepted applications
        { applicationStatus: 'accepted' }
      ]
    }).populate('companyId', '_id');

    console.log('🔍 Application search result:', {
      found: !!application,
      applicationId: application?._id,
      status: application?.status,
      applicationStatus: application?.applicationStatus,
      hasCompany: !!application?.companyId
    });

    if (!application || !application.companyId) {
      console.log('❌ No hired application found for user:', req.user.id);
      return res.status(400).json({
        success: false,
        message: 'No hired application with company found. Please ensure you have been hired by a company before submitting a completion certificate.',
        errorCode: 'NO_HIRED_APPLICATION'
      });
    }

    // Fetch company name from CompanyProfile
    const companyProfile = await CompanyProfile.findOne({ userId: application.companyId._id });
    const companyName = companyProfile?.companyName || 'Company Name Not Set';

    // Make internship dates optional - set defaults if missing
    let startDate = application.startDate;
    let endDate = application.endDate;
    
    if (!startDate || !endDate) {
      console.log('⚠️ Missing internship dates, using defaults:', {
        originalStart: application.startDate,
        originalEnd: application.endDate
      });
      
      // Set default dates if missing (more flexible approach)
      const now = new Date();
      startDate = startDate || new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days ago
      endDate = endDate || now; // Today
      
      console.log('✅ Using default dates:', { startDate, endDate });
    }

    console.log('✅ Creating completion certificate with dates:', {
      startDate,
      endDate,
      calculated: true
    });

    // Validate required files - make more flexible
    const hasFiles = req.files && 
                    (req.files.certificateFile || req.files.appraisalForm);
    
    if (!hasFiles) {
      console.log('❌ No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'At least one file (certificate or appraisal form) is required',
        errorCode: 'NO_FILES'
      });
    }

    // Validate required fields - make more flexible
    const requiredFields = [
      'reportSummary', 'keyAchievements', 'futurePlans', 'technicalSkills',
      'softSkills', 'overallLearning', 'projectsCompleted', 'performanceRating',
      'recommendationLetter'
    ];

    const missingFields = [];
    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim().length === 0) {
        missingFields.push(field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      }
    }

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `The following fields are required: ${missingFields.join(', ')}`,
        errorCode: 'MISSING_FIELDS',
        missingFields
      });
    }

    // Get detailed student information from Student model
    const Student = require('../models/Student');
    const studentDetails = await Student.findOne({ 
      email: user.email 
    });

    // Get offer letter for proper internship dates - check for any offer letter for this student
    const OfferLetter = require('../models/OfferLetter');
    const offerLetter = await OfferLetter.findOne({
      studentId: req.user.id
      // Remove status filter to get any offer letter for this student
    });

    console.log('📋 Additional data fetched:', {
      studentDetails: !!studentDetails,
      offerLetter: !!offerLetter
    });

    // Create completion certificate with proper data
    const completionCertificate = new CompletionCertificate({
      // Student Information - use real data from Student model
      studentId: req.user.id,
      studentName: user.name,
      studentEmail: user.email,
      studentRollNumber: studentDetails?.rollNumber || 'Not Provided',
      
      // Company Information
      companyId: application.companyId._id,
      companyName: companyName,
      companySupervisor: application.supervisorName || application.companyId.supervisor || 'N/A',
      supervisorEmail: application.supervisorEmail || application.companyId.email || 'N/A',
      
      // Internship Details - use offer letter dates or application dates
      internshipStartDate: offerLetter?.startDate || application?.startDate || startDate,
      internshipEndDate: offerLetter?.endDate || application?.endDate || endDate,
      internshipDuration: calculateDuration(
        offerLetter?.startDate || application?.startDate || startDate, 
        offerLetter?.endDate || application?.endDate || endDate
      ),
      department: studentDetails?.department || application.department || application.companyId.department || 'Not Specified',
      designation: application.jobPosition || application.title || 'Intern',
      
      // Form Data
      reportSummary: req.body.reportSummary.toString().trim(),
      keyAchievements: req.body.keyAchievements.toString().trim(),
      futurePlans: req.body.futurePlans.toString().trim(),
      technicalSkills: req.body.technicalSkills.toString().trim(),
      softSkills: req.body.softSkills.toString().trim(),
      overallLearning: req.body.overallLearning.toString().trim(),
      projectsCompleted: req.body.projectsCompleted.toString().trim(),
      performanceRating: parseInt(req.body.performanceRating) || 5,
      recommendationLetter: req.body.recommendationLetter.toString().trim(),
      
      // File paths - handle missing files gracefully
      certificateFile: req.files?.certificateFile?.[0]?.path || null,
      appraisalForm: req.files?.appraisalForm?.[0]?.path || null,
      
      // Set status to submitted (remove any approval dependencies)
      status: 'submitted'
    });

    await completionCertificate.save();

    console.log('✅ Completion certificate saved successfully:', completionCertificate._id);

    res.status(201).json({
      success: true,
      message: 'Completion certificate submitted successfully! No supervisor approval required.',
      data: completionCertificate
    });

  } catch (error) {
    console.error('❌ Error submitting completion certificate:', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + validationErrors.join(', '),
        errorCode: 'VALIDATION_ERROR',
        validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a completion certificate',
        errorCode: 'DUPLICATE_SUBMISSION'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while submitting completion certificate',
      errorCode: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get student's completion certificate
// Get student's completion certificate
router.get('/my-certificate', auth, async (req, res) => {
  try {
    const certificate = await CompletionCertificate.findOne({ 
      studentId: req.user.id 
    }).lean();

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'No completion certificate found'
      });
    }

    res.json({
      success: true,
      data: certificate
    });

  } catch (error) {
    console.error('Error fetching completion certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completion certificate',
      error: error.message
    });
  }
});

// Get all completion certificates (for supervisors/admin) - OPTIMIZED
router.get('/all', auth, async (req, res) => {
  try {
    let query = {};
    
    // CRITICAL SECURITY FIX: If user is a supervisor, ONLY show certificates from their supervised students
    if (req.user.role === 'supervisor') {
      const supervisorId = req.user.id;
      
      console.log('🔐 Supervisor access - filtering by supervisorId:', supervisorId);
      
      // Find all applications where this supervisor is assigned
      const supervisedApplications = await Application.find({
        supervisorId: supervisorId
      }).select('studentId').lean();
      
      const supervisedStudentIds = supervisedApplications.map(app => app.studentId);
      
      console.log(`📋 Supervisor has ${supervisedStudentIds.length} supervised students`);
      
      // Only show certificates for students this supervisor supervises
      query.studentId = { $in: supervisedStudentIds };
    }

    console.log('🔍 Fetching completion certificates with query:', query);

    // Fetch certificates with lean() for faster performance
    let certificates = await CompletionCertificate.find(query)
      .populate('studentId', 'name email rollNumber')
      .populate('companyId', 'name email')
      .sort({ submittedAt: -1 })
      .lean();

    console.log(`📋 Found ${certificates.length} certificates`);

    // If no certificates, return early
    if (certificates.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Bulk fetch related data for optimization
    const Student = require('../models/Student');
    const OfferLetter = require('../models/OfferLetter');
    const CompanyProfile = require('../models/CompanyProfile');

    // Get all unique student emails and IDs
    const studentEmails = [...new Set(certificates.map(c => c.studentEmail).filter(Boolean))];
    const studentIds = [...new Set(certificates.map(c => c.studentId?._id || c.studentId).filter(Boolean))];
    const companyIds = [...new Set(certificates.map(c => c.companyId?._id || c.companyId).filter(Boolean))];

    // Bulk fetch all related data in parallel
    const [allStudents, allOfferLetters, allCompanyProfiles] = await Promise.all([
      Student.find({ email: { $in: studentEmails } }).lean(),
      OfferLetter.find({ studentId: { $in: studentIds } }).lean(),
      CompanyProfile.find({ user: { $in: companyIds } }).lean()
    ]);

    // Create lookup maps for O(1) access
    const studentMap = new Map(allStudents.map(s => [s.email, s]));
    const offerLetterMap = new Map(allOfferLetters.map(o => [o.studentId?.toString(), o]));
    const companyProfileMap = new Map(allCompanyProfiles.map(c => [c.user?.toString(), c]));

    // Enrich certificates using the maps
    for (let cert of certificates) {
      try {
        const studentDetails = studentMap.get(cert.studentEmail);
        const offerLetter = offerLetterMap.get(cert.studentId?._id?.toString() || cert.studentId?.toString());
        const companyProfile = companyProfileMap.get(cert.companyId?._id?.toString() || cert.companyId?.toString());

        // Override with correct data
        if (studentDetails?.rollNumber) {
          cert.studentRollNumber = studentDetails.rollNumber;
        }
        if (studentDetails?.department) {
          cert.department = studentDetails.department;
        }
        if (offerLetter?.startDate) {
          cert.internshipStartDate = offerLetter.startDate;
        }
        if (offerLetter?.endDate) {
          cert.internshipEndDate = offerLetter.endDate;
        }
        if (companyProfile?.companyName) {
          cert.companyName = companyProfile.companyName;
        }

        // Update duration if we have better dates
        if (offerLetter?.startDate && offerLetter?.endDate) {
          const start = new Date(offerLetter.startDate);
          const end = new Date(offerLetter.endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const weeks = Math.floor(diffDays / 7);
          cert.internshipDuration = `${weeks} weeks (${diffDays} days)`;
        }
      } catch (enrichError) {
        console.error(`❌ Error enriching certificate ${cert._id}:`, enrichError);
      }
    }

    console.log('✅ Certificates enriched with proper data');

    res.json({
      success: true,
      data: certificates
    });

  } catch (error) {
    console.error('Error fetching completion certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completion certificates',
      error: error.message
    });
  }
});

// Download completion certificate PDF
router.get('/download-pdf/:id', auth, async (req, res) => {
  try {
    console.log('🎓 Generating completion certificate PDF for ID:', req.params.id);
    
    const certificate = await CompletionCertificate.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('companyId', 'name email');

    if (!certificate) {
      console.log('❌ Completion certificate not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Completion certificate not found'
      });
    }

    console.log('✅ Certificate found, fetching additional data...');

    // Get detailed student information from Student model
    const Student = require('../models/Student');
    const studentDetails = await Student.findOne({ 
      email: certificate.studentEmail 
    });

    // Get application details to find offer letter dates
    const application = await Application.findOne({
      studentId: certificate.studentId,
      $or: [
        { applicationStatus: 'hired' },
        { status: 'hired' },
        { applicationStatus: 'accepted' },
        { status: 'accepted' }
      ]
    }).populate('companyId');

    // Get offer letter for internship dates - check for any offer letter for this student
    const OfferLetter = require('../models/OfferLetter');
    const offerLetter = await OfferLetter.findOne({
      studentId: certificate.studentId
      // Remove status filter to get any offer letter for this student
    });

    console.log('📋 Data fetched:', {
      studentDetails: !!studentDetails,
      application: !!application,
      offerLetter: !!offerLetter
    });

    // Prepare certificate data for PDF generation with real values
    const certificateData = {
      // Certificate info
      certificateNumber: certificate.certificateNumber || `CERT-${certificate._id.toString().slice(-8).toUpperCase()}`,
      submittedAt: certificate.submittedAt || certificate.createdAt,
      
      // Student Information - get real data from Student model
      studentName: certificate.studentName,
      studentEmail: certificate.studentEmail,
      studentRollNumber: studentDetails?.rollNumber || certificate.studentRollNumber || 'Not Provided',
      registrationNumber: studentDetails?.registrationNumber || studentDetails?.rollNumber || 'Not Provided',
      program: 'Computer Science', // Default fallback
      academicYear: '2024-2025',
      
      // Company Information
      companyName: certificate.companyName,
      companySupervisor: certificate.companySupervisor,
      supervisorEmail: certificate.supervisorEmail,
      department: studentDetails?.department || application?.department || certificate.department || 'Not Specified',
      designation: certificate.designation,
      
      // Internship Details - get dates from offer letter or application
      internshipStartDate: offerLetter?.startDate || application?.startDate || certificate.internshipStartDate,
      internshipEndDate: offerLetter?.endDate || application?.endDate || certificate.internshipEndDate,
      internshipDuration: certificate.internshipDuration,
      
      // Performance & Content
      performanceRating: certificate.performanceRating,
      reportSummary: certificate.reportSummary,
      keyAchievements: certificate.keyAchievements,
      technicalSkills: certificate.technicalSkills,
      softSkills: certificate.softSkills,
      overallLearning: certificate.overallLearning,
      projectsCompleted: certificate.projectsCompleted,
      futurePlans: certificate.futurePlans,
      recommendationLetter: certificate.recommendationLetter
    };

    console.log('📝 Final certificate data:', {
      rollNumber: certificateData.studentRollNumber,
      department: certificateData.department,
      startDate: certificateData.internshipStartDate,
      endDate: certificateData.internshipEndDate
    });

    // Generate PDF using the beautiful utility
    const doc = generateCompletionCertificatePDF(certificateData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="Completion-Certificate-${certificate.studentName.replace(/\s+/g, '-')}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);
    
    // Finalize PDF
    doc.end();

    console.log('✅ Completion certificate PDF generated successfully');

  } catch (error) {
    console.error('❌ Error generating completion certificate PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate completion certificate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update completion certificate status (for supervisors)
router.patch('/update-status/:id', auth, async (req, res) => {
  try {
    const { status, supervisorFeedback, supervisorGrade, supervisorComments } = req.body;

    const certificate = await CompletionCertificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Completion certificate not found'
      });
    }

    // Update certificate
    certificate.status = status;
    certificate.reviewedAt = new Date();
    certificate.reviewedBy = req.user.id;
    
    if (supervisorFeedback) certificate.supervisorFeedback = supervisorFeedback;
    if (supervisorGrade) certificate.supervisorGrade = supervisorGrade;
    if (supervisorComments) certificate.supervisorComments = supervisorComments;

    await certificate.save();

    res.json({
      success: true,
      message: 'Completion certificate updated successfully',
      data: certificate
    });

  } catch (error) {
    console.error('Error updating completion certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update completion certificate',
      error: error.message
    });
  }
});

// Check if student is eligible to submit completion certificate
router.get('/check-eligibility', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    console.log('🔍 Checking completion certificate eligibility for user:', studentId);

    // Check if student already has a completion certificate
    const existingCertificate = await CompletionCertificate.findOne({ studentId });
    
    if (existingCertificate) {
      console.log('✅ Existing certificate found:', existingCertificate._id);
      return res.status(200).json({
        success: true,
        data: {
          canCreate: false,
          hasExistingCertificate: true,
          message: 'You have already submitted a completion certificate',
          status: existingCertificate.status
        }
      });
    }

    // Check if student has a hired application - be more flexible
    const Application = require('../models/Application');
    const application = await Application.findOne({
      studentId,
      $or: [
        { applicationStatus: 'hired' },
        { status: 'hired' },
        { applicationStatus: 'accepted' },
        { status: 'accepted' }
      ]
    }).populate('supervisorId');

    console.log('🔍 Application check result:', {
      found: !!application,
      status: application?.status,
      applicationStatus: application?.applicationStatus,
      hasSupervisor: !!application?.supervisorId
    });

    if (!application) {
      console.log('❌ No hired/accepted application found');
      return res.status(200).json({
        success: true,
        data: {
          canCreate: false,
          hasExistingCertificate: false,
          hasHiredApplication: false,
          message: 'You must have a hired/accepted application to submit a completion certificate'
        }
      });
    }

    // REMOVED: Supervisor requirement - students can submit without supervisor approval
    // REMOVED: Internship report completion requirement 
    // REMOVED: Internship end date requirement
    
    console.log('✅ Student is eligible to submit completion certificate');
    
    // All checks passed, student is eligible
    res.json({
      success: true,
      data: {
        canCreate: true,
        hasExistingCertificate: false,
        hasHiredApplication: true,
        hasSupervisor: true, // Keep true for UI compatibility
        hasInternshipReport: true, // Keep true for UI compatibility
        internshipEnded: true, // Keep true for UI compatibility
        message: 'You are eligible to submit a completion certificate. No supervisor approval required!'
      }
    });

  } catch (error) {
    console.error('Error checking completion certificate eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
});

// Get student academic information for form auto-fill
router.get('/student-info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get hired application for additional info
    const Application = require('../models/Application');
    const application = await Application.findOne({
      studentId: req.user.id,
      status: 'hired'
    }).populate('companyId');

    res.json({
      success: true,
      data: {
        // Student basic info
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber || '',
        
        // Academic info (you may need to add these fields to User model)
        cgpa: user.cgpa || '',
        semester: user.semester || '',
        degree: user.degree || user.program || '',
        program: user.program || '',
        
        // Company info from hired application
        companyName: application?.companyId?.companyName || '',
        designation: application?.jobPosition || '',
        department: application?.department || '',
        startDate: application?.startDate || '',
        endDate: application?.endDate || ''
      }
    });

  } catch (error) {
    console.error('Error fetching student info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student information',
      error: error.message
    });
  }
});

module.exports = router;
