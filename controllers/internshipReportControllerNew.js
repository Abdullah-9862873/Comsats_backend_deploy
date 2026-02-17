const InternshipReport = require('../models/InternshipReport');
const User = require('../models/User');
const Application = require('../models/Application');
const CompanyProfile = require('../models/CompanyProfile');
const Notification = require('../models/Notification');
const InternshipReportPDF = require('../utils/internshipReportPdf');
const fs = require('fs');
const path = require('path');

// Submit internship report
const submitReport = async (req, res) => {
  try {
    const { projectTitle, projectDescription, keyAchievements, challengesFaced, skillsLearned, recommendations } = req.body;
    const studentId = req.user.id;
    const uploadedFile = req.file;

    console.log('📋 Internship Report Submission:', {
      studentId,
      projectTitle: projectTitle?.substring(0, 50) + '...',
      projectDescription: projectDescription?.substring(0, 100) + '...',
      hasFile: !!uploadedFile
    });

    // Validate required fields
    if (!projectTitle || !projectDescription) {
      return res.status(400).json({
        success: false,
        message: 'Project title and description are required'
      });
    }

    // Check if student already has a report
    const existingReport = await InternshipReport.findOne({ studentId: studentId });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an internship report'
      });
    }

    // Get student's internship details
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find any supervisor for the student (simplified approach like other reports)
    let supervisorId = null;
    let companyId = null;

    // Try to find from an approved application first
    const application = await Application.findOne({
      studentId: studentId,
      overallStatus: 'approved'
    }).populate('companyId supervisorId');

    if (application) {
      supervisorId = application.supervisorId._id;
      companyId = application.companyId._id;
    } else {
      // If no approved application, find any supervisor (like other report systems)
      const anySupervisor = await User.findOne({ role: 'supervisor' });
      if (anySupervisor) {
        supervisorId = anySupervisor._id;
      }
      
      // Find any company for basic data
      const anyCompany = await User.findOne({ role: 'company' });
      if (anyCompany) {
        companyId = anyCompany._id;
      }
    }

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        message: 'No supervisor available in the system'
      });
    }

    // Create report data
    const reportData = {
      studentId: studentId,
      supervisorId: supervisorId,
      companyId: companyId,
      projectTitle,
      projectDescription,
      keyAchievements: keyAchievements || '',
      challengesFaced: challengesFaced || '',
      skillsLearned: skillsLearned || '',
      recommendations: recommendations || '',
      submittedAt: new Date()
    };

    // Add file information if uploaded
    if (uploadedFile) {
      reportData.documentationFile = {
        filename: uploadedFile.filename,
        originalname: uploadedFile.originalname,
        url: uploadedFile.path,
        mimetype: uploadedFile.mimetype,
        size: uploadedFile.size,
        uploadedAt: new Date()
      };
    }

    // Create the report
    const internshipReport = new InternshipReport(reportData);
    await internshipReport.save();

    // Create notification for supervisor
    const notification = new Notification({
      userId: supervisorId,
      type: 'internship_report_submitted',
      title: 'New Internship Report Submitted',
      message: `${student.name} has submitted their internship report for review`,
      data: {
        reportId: internshipReport._id,
        studentId: studentId,
        studentName: student.name
      }
    });
    await notification.save();

    console.log('✅ Internship report submitted successfully:', internshipReport._id);

    res.status(201).json({
      success: true,
      message: 'Internship report submitted successfully',
      report: {
        id: internshipReport._id,
        projectTitle: internshipReport.projectTitle,
        submittedAt: internshipReport.submittedAt,
        hasDocument: !!internshipReport.documentationFile
      }
    });

  } catch (error) {
    console.error('Error submitting internship report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit internship report',
      error: error.message
    });
  }
};

// Get student's internship report
const getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const requestingUserId = req.user.id;
    const userRole = req.user.role;

    // Authorization: student can view their own report, supervisors and admins can view any
    if (userRole === 'student' && studentId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own internship report'
      });
    }

    const report = await InternshipReport.findOne({ studentId: studentId })
      .populate('studentId', 'name email rollNumber')
      .populate('supervisorId', 'name email')
      .populate('companyId', '_id')
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'No internship report found for this student'
      });
    }

    // Fetch company profile if companyId exists
    let companyName = null;
    if (report.companyId?._id) {
      const companyProfile = await CompanyProfile.findOne({ userId: report.companyId._id }).lean();
      companyName = companyProfile?.companyName || null;
    }

    res.json({
      success: true,
      data: {
        _id: report._id,
        projectTitle: report.projectTitle,
        projectDescription: report.projectDescription,
        keyAchievements: report.keyAchievements,
        challengesFaced: report.challengesFaced,
        skillsLearned: report.skillsLearned,
        recommendations: report.recommendations,
        acknowledgement: report.acknowledgement,
        executiveSummary: report.executiveSummary,
        tableOfContents: report.tableOfContents,
        conclusion: report.conclusion,
        status: report.status,
        submittedAt: report.submittedAt,
        studentId: report.studentId,
        supervisorId: report.supervisorId,
        companyId: {
          _id: report.companyId?._id,
          companyName: companyName
        },
        studentName: report.studentId?.name,
        rollNumber: report.studentId?.rollNumber,
        supervisorName: report.supervisorId?.name,
        companyName: companyName,
        supervisorFeedback: report.supervisorFeedback?.text,
        hasDocument: !!report.documentationFile
      }
    });

  } catch (error) {
    console.error('Error fetching student internship report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch internship report',
      error: error.message
    });
  }
};

// Get all reports for a supervisor
const getSupervisorReports = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = req.user.role === 'admin' ? {} : { supervisorId: supervisorId };

    const reports = await InternshipReport.find(query)
      .populate('studentId', 'name email rollNumber')
      .populate('companyId', '_id')
      .sort({ submittedAt: -1 })
      .lean();

    // Fetch company profiles for all company IDs
    const companyIds = reports.map(r => r.companyId?._id).filter(Boolean);
    const companyProfiles = await CompanyProfile.find({ userId: { $in: companyIds } }).lean();
    
    // Create a map of userId to companyName
    const companyMap = {};
    companyProfiles.forEach(profile => {
      companyMap[profile.userId.toString()] = profile.companyName;
    });

    // Transform the data to match frontend expectations
    const transformedReports = reports.map(report => ({
      _id: report._id,
      projectTitle: report.projectTitle,
      projectDescription: report.projectDescription,
      keyAchievements: report.keyAchievements,
      challengesFaced: report.challengesFaced,
      skillsLearned: report.skillsLearned,
      recommendations: report.recommendations,
      status: report.status,
      submittedAt: report.submittedAt,
      acknowledgement: report.acknowledgement,
      executiveSummary: report.executiveSummary,
      tableOfContents: report.tableOfContents,
      conclusion: report.conclusion,
      studentId: report.studentId,
      companyId: {
        _id: report.companyId?._id,
        companyName: companyMap[report.companyId?._id?.toString()] || null
      },
      studentName: report.studentId?.name,
      rollNumber: report.studentId?.rollNumber,
      companyName: companyMap[report.companyId?._id?.toString()] || null,
      supervisorFeedback: report.supervisorFeedback?.text
    }));

    res.json({
      success: true,
      data: transformedReports
    });

  } catch (error) {
    console.error('Error fetching supervisor reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// Download PDF of internship report
const downloadPDF = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await InternshipReport.findById(reportId)
      .populate('student', 'name email rollNumber')
      .populate('supervisor', 'name email')
      .populate('company', 'name')
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Internship report not found'
      });
    }

    // Authorization check
    const isAuthorized = 
      userRole === 'admin' ||
      (userRole === 'student' && report.student._id.toString() === userId) ||
      (userRole === 'supervisor' && report.supervisor._id.toString() === userId);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to download this report'
      });
    }

    // Generate PDF
    const pdfBuffer = await InternshipReportPDF.generatePDF(report);

    // Set response headers
    const filename = `internship_report_${report.student.name.replace(/\s+/g, '_')}_${reportId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating internship report PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
};

// Add feedback to internship report
const addFeedback = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { feedback, grade } = req.body;
    const supervisorId = req.user.id;

    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only supervisors and admins can add feedback'
      });
    }

    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required'
      });
    }

    const report = await InternshipReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Internship report not found'
      });
    }

    // Authorization: supervisor can only add feedback to their own students' reports
    if (req.user.role === 'supervisor' && report.supervisor.toString() !== supervisorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only add feedback to your own students\' reports'
      });
    }

    // Update report with feedback
    report.feedback = feedback;
    if (grade) {
      report.grade = grade;
    }
    report.feedbackDate = new Date();
    await report.save();

    // Create notification for student
    const notification = new Notification({
      recipient: report.student,
      type: 'internship_report_feedback',
      title: 'Internship Report Feedback Received',
      message: 'Your supervisor has provided feedback on your internship report',
      data: {
        reportId: report._id,
        grade: grade || null
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Feedback added successfully',
      report: {
        id: report._id,
        feedback: report.feedback,
        grade: report.grade,
        feedbackDate: report.feedbackDate
      }
    });

  } catch (error) {
    console.error('Error adding feedback to internship report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback',
      error: error.message
    });
  }
};

// Get all reports (admin only)
const getAllReports = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const reports = await InternshipReport.find()
      .populate('student', 'name email rollNumber')
      .populate('supervisor', 'name email')
      .populate('company', 'name')
      .sort({ submissionDate: -1 })
      .lean();

    res.json({
      success: true,
      reports,
      count: reports.length
    });

  } catch (error) {
    console.error('Error fetching all internship reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

module.exports = {
  submitReport,
  getStudentReport,
  getSupervisorReports,
  downloadPDF,
  addFeedback,
  getAllReports
};
