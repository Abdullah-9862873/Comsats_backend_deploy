const InternshipReport = require('../models/InternshipReport');
const Application = require('../models/Application');
const User = require('../models/User');
const Student = require('../models/Student');
const path = require('path');
const fs = require('fs');
const { generateFinalInternshipReportPDF } = require('../utils/finalInternshipReportPdf');
const { COMSATSFinalInternshipReportPDFGenerator } = require('../utils/professionalFinalInternshipReportPdf');

// Submit internship report (Student)
const createInternshipReport = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Check if student already has an internship report
    const existingReport = await InternshipReport.findOne({ studentId });
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an internship report'
      });
    }

    // Check if student has a hired application with supervisor
    const application = await Application.findOne({
      studentId,
      status: 'hired'
    }).populate('supervisorId');

    if (!application) {
      return res.status(400).json({
        success: false,
        message: 'You must have a hired application to submit an internship report'
      });
    }

    if (!application.supervisorId) {
      return res.status(400).json({
        success: false,
        message: 'You must have an assigned supervisor to submit an internship report'
      });
    }

    // Process uploaded files
    const appendices = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype
    })) : [];

    // Get student and company information
    const student = await User.findById(studentId);
    const company = await User.findById(application.companyId);

    // Create internship report
    const reportData = {
      studentId,
      studentName: student.name,
      rollNumber: student.rollNumber || 'N/A',
      supervisorId: application.supervisorId._id,
      supervisorName: application.supervisorId.name,
      supervisorEmail: application.supervisorId.email,
      companyId: application.companyId,
      companyName: company.companyName || company.name,
      acknowledgement: req.body.acknowledgement,
      executiveSummary: req.body.executiveSummary,
      tableOfContents: req.body.tableOfContents,
      projectRequirements: req.body.projectRequirements,
      approachAndTools: req.body.approachAndTools,
      outcomesAchieved: req.body.outcomesAchieved,
      knowledgeAcquired: req.body.knowledgeAcquired,
      skillsLearned: req.body.skillsLearned,
      attitudesAndValues: req.body.attitudesAndValues,
      challengingTask: req.body.challengingTask,
      challengesAndSolutions: req.body.challengesAndSolutions,
      reflectionAndConclusion: req.body.reflectionAndConclusion,
      appendices
    };

    const report = new InternshipReport(reportData);
    await report.save();

    // Populate student and supervisor info for response
    await report.populate([
      { path: 'studentId', select: 'name email' },
      { path: 'supervisorId', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Internship report submitted successfully',
      data: report
    });

  } catch (error) {
    console.error('Error creating internship report:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit internship report',
      error: error.message
    });
  }
};

// Get student's internship report
const getStudentInternshipReport = async (req, res) => {
  try {
    const studentId = req.user.id;

    const report = await InternshipReport.findOne({ studentId })
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email')
      .populate('companyId', 'companyName');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'No internship report found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
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

// Get all internship reports for supervisor
const getSupervisorInternshipReports = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const reports = await InternshipReport.find({ supervisorId })
      .populate('studentId', 'name email')
      .populate('companyId', 'companyName')
      .sort({ submittedAt: -1 });

    // Get company names from CompanyProfile (3rd step registration)
    const CompanyProfile = require('../models/CompanyProfile');
    
    for (let report of reports) {
      if (report.companyId) {
        const companyProfile = await CompanyProfile.findOne({ 
          userId: report.companyId._id 
        });
        if (companyProfile?.companyName) {
          report.companyName = companyProfile.companyName;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('Error fetching supervisor internship reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch internship reports',
      error: error.message
    });
  }
};

// Add supervisor feedback
const addSupervisorFeedback = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { feedback, grade } = req.body;
    const supervisorId = req.user.id;

    const report = await InternshipReport.findOne({
      _id: reportId,
      supervisorId
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Internship report not found or not authorized'
      });
    }

    report.supervisorFeedback = feedback;
    if (grade) {
      report.grade = grade;
    }
    report.reviewedAt = new Date();

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Feedback added successfully',
      data: report
    });

  } catch (error) {
    console.error('Error adding supervisor feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback',
      error: error.message
    });
  }
};

// Get internship report by ID
const getInternshipReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await InternshipReport.findById(reportId)
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email')
      .populate('companyId', 'companyName');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Internship report not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && report.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this report'
      });
    }

    if (req.user.role === 'supervisor' && report.supervisorId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this report'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error fetching internship report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch internship report',
      error: error.message
    });
  }
};

// Download appendix file
const downloadAppendixFile = async (req, res) => {
  try {
    const { reportId, fileIndex } = req.params;

    const report = await InternshipReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Internship report not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && report.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this file'
      });
    }

    if (req.user.role === 'supervisor' && report.supervisorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this file'
      });
    }

    const fileIndex_num = parseInt(fileIndex);
    if (fileIndex_num < 0 || fileIndex_num >= report.appendices.length) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const file = report.appendices[fileIndex_num];
    const filePath = path.resolve(file.path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Error downloading appendix file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
};

// Check internship report eligibility
const checkInternshipReportEligibility = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Check if student already has an internship report
    const existingReport = await InternshipReport.findOne({ studentId });
    
    if (existingReport) {
      return res.status(200).json({
        success: true,
        data: {
          canCreate: false,
          hasExistingReport: true,
          message: 'You have already submitted an internship report'
        }
      });
    }

    // Check if student has a hired application
    const application = await Application.findOne({
      studentId,
      status: 'hired'
    }).populate('supervisorId');

    if (!application) {
      return res.status(200).json({
        success: true,
        data: {
          canCreate: false,
          hasExistingReport: false,
          hasHiredApplication: false,
          message: 'You must have a hired application to submit an internship report'
        }
      });
    }

    if (!application.supervisorId) {
      return res.status(200).json({
        success: true,
        data: {
          canCreate: false,
          hasExistingReport: false,
          hasHiredApplication: true,
          hasSupervisor: false,
          message: 'You must have an assigned supervisor to submit an internship report'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        canCreate: true,
        hasExistingReport: false,
        hasHiredApplication: true,
        hasSupervisor: true,
        message: 'You are eligible to submit an internship report'
      }
    });

  } catch (error) {
    console.error('Error checking internship report eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
};

// Generate PDF for internship report
const generateInternshipReportPDF = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`📄 PDF Download Request - Report ID: ${reportId}, User: ${userId}, Role: ${userRole}`);

    // Find the internship report
    const report = await InternshipReport.findById(reportId)
      .populate('studentId', 'name email')
      .populate('supervisorId', 'name email')
      .populate('companyId', 'companyName name');

    if (!report) {
      console.log(`❌ PDF Download Failed - Report not found: ${reportId}`);
      return res.status(404).json({
        success: false,
        message: 'Internship report not found',
        reportId: reportId
      });
    }

    console.log(`✅ PDF Download - Report found: ${report._id}, Student: ${report.studentId?.name}`);

    // Fetch student details from Student model to get rollNumber
    const studentDetails = await Student.findOne({ 
      userId: report.studentId._id 
    }).select('rollNumber phoneNumber');

    // Fetch student's application to get company details
    const studentApplication = await Application.findOne({
      studentId: report.studentId._id,
      status: 'hired'
    }).populate('companyId', 'name location');

    // Check authorization
    if (userRole === 'student' && report.studentId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    if (userRole === 'supervisor' && report.supervisorId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    console.log('📋 Student details found:', studentDetails ? 'Yes' : 'No');
    console.log('📋 Student application found:', studentApplication ? 'Yes' : 'No');

    // Generate PDF filename for download
    const sanitizedStudentName = report.studentId.name.replace(/[^a-zA-Z0-9]/g, '_');
    const pdfFilename = `Final_Internship_Report_${sanitizedStudentName}_${Date.now()}.pdf`;

    console.log('📁 Generating PDF:', pdfFilename);

    // Prepare report data for PDF generation
    const reportData = {
      student: {
        name: report.studentId.name,
        rollNo: studentDetails?.rollNumber || 'N/A',
        email: report.studentId.email
      },
      company: {
        name: report.companyId?.companyName || report.companyId?.name || (studentApplication?.companyId?.name) || 'N/A',
        supervisor: report.supervisorId?.name || report.supervisorName || 'N/A',
        department: studentApplication?.department || studentApplication?.studentProfile?.department || 'N/A'
      },
      internship: {
        title: studentApplication?.jobPosition || 'Internship Position'
      },
      // Content sections mapped to correct InternshipReport fields
      executiveSummary: report.executiveSummary,
      companyOverview: report.acknowledgement, // Using acknowledgement as company overview
      projectDescription: report.projectRequirements,
      skillsLearned: report.skillsLearned,
      challenges: report.challengesAndSolutions,
      achievements: report.outcomesAchieved,
      recommendations: report.approachAndTools,
      conclusion: report.reflectionAndConclusion,
      supportingFiles: report.appendices || [],
      // Additional legacy support
      studentName: report.studentId.name,
      studentRollNo: studentDetails?.rollNumber || 'N/A',
      supervisorName: report.supervisorId?.name || report.supervisorName || 'N/A',
      companyName: report.companyId?.companyName || report.companyId?.name || (studentApplication?.companyId?.name) || 'N/A',
      department: studentApplication?.department || studentApplication?.studentProfile?.department || 'N/A',
      position: studentApplication?.jobPosition || 'Internship Position'
    };

    // Generate professional A4 PDF with COMSATS styling
    const pdfGenerator = new COMSATSFinalInternshipReportPDFGenerator();
    
    // Set response headers for streaming
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Stream PDF directly to response
    pdfGenerator.doc.pipe(res);
    
    // Prepare student and internship info table data
    const infoData = [
      ['Student Name', report.studentId.name],
      ['Roll Number', studentDetails?.rollNumber || 'N/A'],
      ['Email', report.studentId.email],
      ['Supervisor', report.supervisorId?.name || 'N/A'],
      ['Company', report.companyId?.companyName || report.companyId?.name || 'N/A'],
      ['Department', studentApplication?.department || 'N/A'],
      ['Position', studentApplication?.jobPosition || 'Internship Position'],
      ['Submitted', new Date(report.submittedAt).toLocaleDateString()]
    ];
    
    // Generate professional A4 PDF with Times New Roman fonts
    pdfGenerator
      .addHeader()
      .addTitle('FINAL INTERNSHIP REPORT')
      .addSectionHeading('STUDENT & INTERNSHIP DETAILS')
      .addInfoTable(infoData);
    
    // Add content sections based on actual InternshipReport fields
    if (report.acknowledgement && report.acknowledgement.trim()) {
      pdfGenerator.addContentSection('1. ACKNOWLEDGEMENT', report.acknowledgement.trim());
    }
    
    if (report.executiveSummary && report.executiveSummary.trim()) {
      pdfGenerator.addContentSection('2. EXECUTIVE SUMMARY', report.executiveSummary.trim());
    }
    
    if (report.tableOfContents && report.tableOfContents.trim()) {
      pdfGenerator.addContentSection('3. TABLE OF CONTENTS', report.tableOfContents.trim());
    }
    
    if (report.projectRequirements && report.projectRequirements.trim()) {
      pdfGenerator.addContentSection('4. PROJECT REQUIREMENTS', report.projectRequirements.trim());
    }
    
    if (report.approachAndTools && report.approachAndTools.trim()) {
      pdfGenerator.addContentSection('5. APPROACH AND TOOLS', report.approachAndTools.trim());
    }
    
    if (report.outcomesAchieved && report.outcomesAchieved.trim()) {
      pdfGenerator.addContentSection('6. OUTCOMES ACHIEVED', report.outcomesAchieved.trim());
    }
    
    if (report.knowledgeAcquired && report.knowledgeAcquired.trim()) {
      pdfGenerator.addContentSection('7. KNOWLEDGE ACQUIRED', report.knowledgeAcquired.trim());
    }
    
    if (report.skillsLearned && report.skillsLearned.trim()) {
      pdfGenerator.addContentSection('8. SKILLS LEARNED', report.skillsLearned.trim());
    }
    
    if (report.attitudesAndValues && report.attitudesAndValues.trim()) {
      pdfGenerator.addContentSection('9. ATTITUDES AND VALUES', report.attitudesAndValues.trim());
    }
    
    if (report.challengingTask && report.challengingTask.trim()) {
      pdfGenerator.addContentSection('10. MOST CHALLENGING TASK', report.challengingTask.trim());
    }
    
    if (report.challengesAndSolutions && report.challengesAndSolutions.trim()) {
      pdfGenerator.addContentSection('11. CHALLENGES AND SOLUTIONS', report.challengesAndSolutions.trim());
    }
    
    if (report.reflectionAndConclusion && report.reflectionAndConclusion.trim()) {
      pdfGenerator.addContentSection('12. REFLECTION AND CONCLUSION', report.reflectionAndConclusion.trim());
    }
    
    // Add supporting files section if files are attached
    if (report.appendices && report.appendices.length > 0) {
      const filesInfo = report.appendices.map((file, index) => 
        `${index + 1}. ${file.originalName} (${file.mimeType || 'Unknown type'})`
      ).join('\n');
      pdfGenerator.addContentSection('13. SUPPORTING DOCUMENTS', filesInfo);
    }
    
    // Add signature section for report validation
    pdfGenerator
      .addSignatureSection()
      .addFooter()
      .finalize();
    
    console.log('✅ Professional A4 Final Internship Report PDF generated and streamed successfully');

  } catch (error) {
    console.error('Error generating internship report PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF'
    });
  }
};

module.exports = {
  createInternshipReport,
  getStudentInternshipReport,
  getSupervisorInternshipReports,
  addSupervisorFeedback,
  getInternshipReportById,
  downloadAppendixFile,
  checkInternshipReportEligibility,
  generateInternshipReportPDF
};
