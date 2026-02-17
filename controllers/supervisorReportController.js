const SupervisorReport = require('../models/SupervisorReport');
const Application = require('../models/Application');
const User = require('../models/User');

// @desc    Create a new supervisor report
// @route   POST /api/supervisor-reports
// @access  Private (Company only)
const createSupervisorReport = async (req, res) => {
  try {
    const { studentId, applicationId, reportType, reportTitle, reportText, priority } = req.body;
    const companyId = req.user.id;

    console.log('=== CREATE SUPERVISOR REPORT ===');
    console.log('Student ID:', studentId);
    console.log('Application ID:', applicationId);
    console.log('Report Type:', reportType);

    // Validate required fields
    if (!studentId || !applicationId || !reportType || !reportTitle || !reportText) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, application ID, report type, title, and text are required'
      });
    }

    // Validate report type
    const validReportTypes = ['misconduct', 'appraisal', 'progress'];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type. Must be misconduct, appraisal, or progress'
      });
    }

    // Find the application to get all necessary details
    const application = await Application.findById(applicationId)
      .populate('studentId', 'name email registrationNumber department semester profilePicture rollNumber')
      .populate('supervisorId', 'name email')
      .populate('jobId', 'title');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify company ownership
    if (application.companyId.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create report for this application'
      });
    }

    // Verify student is hired
    if (application.applicationStatus !== 'hired') {
      return res.status(400).json({
        success: false,
        message: 'Can only create reports for hired students'
      });
    }

    // Get company details
    const company = await User.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Create the report
    const report = new SupervisorReport({
      studentId: application.studentId._id,
      studentName: application.studentId.name,
      studentEmail: application.studentId.email,
      studentDetails: {
        registrationNumber: application.studentId.registrationNumber,
        department: application.studentId.department,
        semester: application.studentId.semester,
        profilePicture: application.studentId.profilePicture,
        rollNumber: application.studentId.rollNumber // Add roll number to report
      },
      supervisorId: application.supervisorId._id,
      supervisorName: application.supervisorId.name,
      companyId: companyId,
      companyName: company.name,
      applicationId: applicationId,
      jobTitle: application.jobId.title,
      reportType,
      reportTitle,
      reportText,
      priority: priority || 'medium'
    });

    await report.save();

    // Populate the saved report for response
    const savedReport = await SupervisorReport.findById(report._id)
      .populate('studentId', 'name email registrationNumber department')
      .populate('supervisorId', 'name email')
      .populate('companyId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Supervisor report created successfully',
      data: savedReport
    });

  } catch (error) {
    console.error('Error creating supervisor report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating supervisor report',
      error: error.message
    });
  }
};

// @desc    Get supervisor reports for a specific supervisor
// @route   GET /api/supervisor-reports/:supervisorId
// @access  Private (Supervisor only)
const getSupervisorReports = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const requestUserId = req.user.id;

    console.log('=== GET SUPERVISOR REPORTS ===');
    console.log('Supervisor ID:', supervisorId);
    console.log('Request User ID:', requestUserId);

    // Verify the requesting user is the supervisor or an admin
    if (requestUserId !== supervisorId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these reports'
      });
    }

    // Get all reports for this supervisor
    const reports = await SupervisorReport.find({ supervisorId })
      .populate('studentId', 'name email registrationNumber department semester')
      .populate('companyId', 'name email')
      .populate('applicationId', 'jobTitle')
      .sort({ reportDate: -1 });

    res.json({
      success: true,
      message: 'Reports fetched successfully',
      data: reports
    });

  } catch (error) {
    console.error('Error fetching supervisor reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supervisor reports',
      error: error.message
    });
  }
};

// @desc    Get company reports (reports created by a company)
// @route   GET /api/supervisor-reports/company/:companyId
// @access  Private (Company only)
const getCompanyReports = async (req, res) => {
  try {
    const { companyId } = req.params;
    const requestUserId = req.user.id;

    console.log('=== GET COMPANY REPORTS ===');
    console.log('Company ID:', companyId);

    // Verify the requesting user is the company or an admin
    if (requestUserId !== companyId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these reports'
      });
    }

    // Get all reports created by this company
    const reports = await SupervisorReport.find({ companyId })
      .populate('studentId', 'name email registrationNumber department')
      .populate('supervisorId', 'name email')
      .populate('applicationId', 'jobTitle')
      .sort({ reportDate: -1 });

    res.json({
      success: true,
      message: 'Company reports fetched successfully',
      data: reports
    });

  } catch (error) {
    console.error('Error fetching company reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company reports',
      error: error.message
    });
  }
};

// @desc    Mark report as read
// @route   PATCH /api/supervisor-reports/:reportId/read
// @access  Private (Supervisor only)
const markReportAsRead = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    const report = await SupervisorReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Verify the requesting user is the supervisor
    if (report.supervisorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    report.isRead = true;
    await report.save();

    res.json({
      success: true,
      message: 'Report marked as read',
      data: report
    });

  } catch (error) {
    console.error('Error marking report as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating report',
      error: error.message
    });
  }
};

module.exports = {
  createSupervisorReport,
  getSupervisorReports,
  getCompanyReports,
  markReportAsRead
};
