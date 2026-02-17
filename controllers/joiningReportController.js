const JoiningReport = require('../models/JoiningReport');
const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');
const CompanyProfile = require('../models/CompanyProfile');

// Create joining report
const createJoiningReport = async (req, res) => {
  try {
    const { studentThoughts, acknowledgment } = req.body;
    const studentId = req.user.id;

    if (!studentThoughts || !acknowledgment) {
      return res.status(400).json({
        success: false,
        message: 'Student thoughts and acknowledgment are required'
      });
    }

    // Check if student has a hired application
    const hiredApplication = await Application.findOne({
      studentId,
      applicationStatus: 'hired'
    })
    .populate('companyId', '_id')
    .populate('jobId', 'jobTitle startDate endDate')
    .populate('supervisorId', 'name email');

    if (!hiredApplication) {
      return res.status(400).json({
        success: false,
        message: 'You must be hired by a company to create a joining report'
      });
    }

    // Check if joining report already exists
    const existingReport = await JoiningReport.findOne({ studentId });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'Joining report already submitted'
      });
    }

    // Get student details
    const student = await User.findById(studentId);

    // Fetch company name from CompanyProfile
    const companyProfile = await CompanyProfile.findOne({ user: hiredApplication.companyId._id });
    const companyName = companyProfile?.companyName || 'Company Name Not Set';

    // Create joining report
    const joiningReport = new JoiningReport({
      studentId,
      studentName: student.name,
      rollNumber: student.student?.regNo || 'N/A',
      companyId: hiredApplication.companyId._id,
      companyName: companyName,
      position: hiredApplication.jobId?.jobTitle || 'Not Specified',
      department: hiredApplication.studentProfile?.department || 'N/A',
      supervisorId: hiredApplication.supervisorId._id,
      supervisorName: hiredApplication.supervisorId.name,
      supervisorEmail: hiredApplication.supervisorId.email,
      internshipStart: hiredApplication.jobId.startDate,
      internshipEnd: hiredApplication.jobId.endDate,
      studentThoughts,
      acknowledgment
    });

    await joiningReport.save();

    res.status(201).json({
      success: true,
      message: 'Joining report created successfully',
      data: joiningReport
    });

  } catch (error) {
    console.error('Create joining report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create joining report',
      error: error.message
    });
  }
};

// Get student's joining report
const getStudentJoiningReport = async (req, res) => {
  try {
    const studentId = req.user.id;

    const report = await JoiningReport.findOne({ studentId })
      .populate('supervisorId', 'name email')
      .lean();

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Get student joining report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch joining report',
      error: error.message
    });
  }
};

// Get supervisor's assigned students' joining reports
const getSupervisorJoiningReports = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const reports = await JoiningReport.find({ supervisorId })
      .populate('studentId', 'name email')
      .sort({ reportDate: -1 })
      .lean();

    // Enhanced data population similar to completion certificates
    const Student = require('../models/Student');
    const OfferLetter = require('../models/OfferLetter');
    const CompanyProfile = require('../models/CompanyProfile');

    const enhancedReports = await Promise.all(reports.map(async (report) => {
      // .lean() already returns a plain object, no need for .toObject()
      const reportObj = { ...report };
      
      try {
        // Get student details from Student model
        const studentDetails = await Student.findOne({ email: reportObj.studentId?.email });
        
        // Get offer letter details for position and better dates
        const offerLetter = await OfferLetter.findOne({ studentId: reportObj.studentId?._id });
        
        // CRITICAL FIX: Fetch company name from CompanyProfile (3rd step registration)
        // This ensures we show the correct company name, not from User model
        if (reportObj.companyId) {
          const companyProfile = await CompanyProfile.findOne({ userId: reportObj.companyId });
          if (companyProfile && companyProfile.companyName) {
            reportObj.companyName = companyProfile.companyName;
            console.log(`✅ Updated company name from CompanyProfile: ${companyProfile.companyName}`);
          }
        }
        
        // Override with correct data where available
        if (studentDetails) {
          // Use regNo from Student model if available and not already set correctly
          if (!reportObj.rollNumber || reportObj.rollNumber === 'N/A') {
            reportObj.rollNumber = studentDetails.regNo || reportObj.rollNumber;
          }
          
          // Use student email from Student model
          if (studentDetails.email) {
            reportObj.studentEmail = studentDetails.email;
          }
          
          // Use department from Student model
          if (studentDetails.department) {
            reportObj.department = studentDetails.department;
          }
        }
        
        // Get position from offer letter
        if (offerLetter) {
          if (offerLetter.position) {
            reportObj.position = offerLetter.position;
          }
          
          // Use dates from offer letter if available
          if (offerLetter.startDate) {
            reportObj.internshipStart = offerLetter.startDate;
          }
          if (offerLetter.endDate) {
            reportObj.internshipEnd = offerLetter.endDate;
          }
        }
        
        console.log(`Enhanced joining report for ${reportObj.studentName}:`, {
          originalRollNumber: report.rollNumber,
          enhancedRollNumber: reportObj.rollNumber,
          originalCompanyName: report.companyName,
          enhancedCompanyName: reportObj.companyName,
          department: reportObj.department,
          position: reportObj.position,
          studentEmail: reportObj.studentEmail
        });
        
      } catch (enhanceError) {
        console.error(`Error enhancing joining report data for ${reportObj.studentName}:`, enhanceError);
      }
      
      return reportObj;
    }));

    res.json({
      success: true,
      data: enhancedReports
    });

  } catch (error) {
    console.error('Get supervisor joining reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch joining reports',
      error: error.message
    });
  }
};

// Verify joining report
const verifyJoiningReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const supervisorId = req.user.id;

    const report = await JoiningReport.findOneAndUpdate(
      { _id: reportId, supervisorId },
      { status: 'Verified' },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Joining report not found'
      });
    }

    res.json({
      success: true,
      message: 'Joining report verified successfully',
      data: report
    });

  } catch (error) {
    console.error('Verify joining report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify joining report',
      error: error.message
    });
  }
};

// Get joining report by ID
const getJoiningReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await JoiningReport.findById(reportId)
      .populate('studentId', 'name email')
      .populate('companyId', 'name')
      .populate('supervisorId', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Joining report not found'
      });
    }

    // Enhanced data population
    const Student = require('../models/Student');
    const OfferLetter = require('../models/OfferLetter');
    
    const reportObj = report.toObject();
    
    try {
      // Get student details from Student model
      const studentDetails = await Student.findOne({ email: reportObj.studentId?.email });
      
      // Get offer letter details for position and better dates
      const offerLetter = await OfferLetter.findOne({ studentId: reportObj.studentId?._id });
      
      // Override with correct data where available
      if (studentDetails) {
        // Use regNo from Student model if available and not already set correctly
        if (!reportObj.rollNumber || reportObj.rollNumber === 'N/A') {
          reportObj.rollNumber = studentDetails.regNo || reportObj.rollNumber;
        }
        
        // Use student email from Student model
        if (studentDetails.email) {
          reportObj.studentEmail = studentDetails.email;
        }
        
        // Use department from Student model
        if (studentDetails.department) {
          reportObj.department = studentDetails.department;
        }
      }
      
      // Get position from offer letter or application
      if (offerLetter) {
        if (offerLetter.position) {
          reportObj.position = offerLetter.position;
        }
        
        // Use dates from offer letter if available
        if (offerLetter.startDate) {
          reportObj.internshipStart = offerLetter.startDate;
        }
        if (offerLetter.endDate) {
          reportObj.internshipEnd = offerLetter.endDate;
        }
      }
      
      // If position still not set, get from application
      if (!reportObj.position || reportObj.position === 'Not Specified') {
        const Application = require('../models/Application');
        const application = await Application.findOne({ 
          studentId: reportObj.studentId?._id,
          applicationStatus: 'hired'
        }).populate('jobId', 'jobTitle');
        
        if (application?.jobId?.jobTitle) {
          reportObj.position = application.jobId.jobTitle;
        }
      }
      
      console.log(`Enhanced single joining report for ${reportObj.studentName}:`, {
        originalRollNumber: report.rollNumber,
        enhancedRollNumber: reportObj.rollNumber,
        department: reportObj.department,
        position: reportObj.position,
        studentEmail: reportObj.studentEmail
      });
      
    } catch (enhanceError) {
      console.error(`Error enhancing joining report data for ${reportObj.studentName}:`, enhanceError);
    }

    res.json({
      success: true,
      data: reportObj
    });

  } catch (error) {
    console.error('Get joining report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch joining report',
      error: error.message
    });
  }
};

// Check if student can create joining report
const checkJoiningReportEligibility = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Check if student has a hired application
    const hiredApplication = await Application.findOne({
      studentId,
      applicationStatus: 'hired'
    })
    .populate('companyId', 'name')
    .populate('jobId', 'title startDate endDate')
    .populate('supervisorId', 'name email');

    // Check if joining report already exists
    const existingReport = await JoiningReport.findOne({ studentId });

    res.json({
      success: true,
      data: {
        canCreate: !!hiredApplication && !existingReport,
        hasHiredApplication: !!hiredApplication,
        hasExistingReport: !!existingReport,
        applicationData: hiredApplication
      }
    });

  } catch (error) {
    console.error('Check joining report eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
};

module.exports = {
  createJoiningReport,
  getStudentJoiningReport,
  getSupervisorJoiningReports,
  verifyJoiningReport,
  getJoiningReportById,
  checkJoiningReportEligibility
};