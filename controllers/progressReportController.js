const ProgressReport = require('../models/ProgressReport');
const Application = require('../models/Application');
const Student = require('../models/Student');
const User = require('../models/User');

const createProgressReport = async (req, res) => {
  try {
    const {
      studentId,
      reportingPeriod,
      tasksAssigned,
      progressMade,
      hoursWorked,
      qualityOfWork,
      areasOfImprovement,
      nextGoals,
      remarks
    } = req.body;
    
    const companyUserId = req.user.id;

    // Verify company has hired this student
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

    // Get student details
    const studentUser = await User.findById(studentId);
    const student = await Student.findOne({ email: studentUser.email }).populate('selectedSupervisorId', 'name email');
    
    if (!student || !student.selectedSupervisorId) {
      return res.status(400).json({
        success: false,
        message: 'Student does not have an assigned supervisor'
      });
    }

    // Get company details
    const companyUser = await User.findById(companyUserId);
    const CompanyProfile = require('../models/CompanyProfile');
    const companyProfile = await CompanyProfile.findOne({ user: companyUserId });
    const companyName = companyProfile?.companyName || companyUser.name || 'Unknown Company';

    // No supporting materials processing needed

    const report = new ProgressReport({
      studentId,
      studentName: student.fullName,
      rollNumber: hiredApplication.studentProfile?.rollNumber || 'N/A',
      department: student.department,
      companyId: companyUserId,
      companyName,
      supervisorId: student.selectedSupervisorId._id,
      supervisorName: student.selectedSupervisorId.name,
      reportingPeriod,
      tasksAssigned,
      progressMade,
      hoursWorked: hoursWorked || 0,
      qualityOfWork,
      areasOfImprovement: areasOfImprovement || '',
      nextGoals: nextGoals || '',
      remarks: remarks || '',
      reportType: 'Progress'
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Progress report created successfully',
      data: report
    });
  } catch (error) {
    console.error('Create progress report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create progress report',
      error: error.message
    });
  }
};

const getCompanyReports = async (req, res) => {
  try {
    const { companyId } = req.params;
    const requestingCompanyId = req.user.id;
    
    if (companyId !== requestingCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const reports = await ProgressReport.find({
      companyId: requestingCompanyId
    }).sort({ createdAt: -1 });

    // Update roll numbers and company names from respective models to ensure accurate data
    const reportsWithCorrectData = await Promise.all(
      reports.map(async (report) => {
        const reportObj = report.toObject();
        try {
          // Get student user to find their email
          const studentUser = await User.findById(report.studentId);
          if (studentUser) {
            // Get student profile to fetch roll number
            const student = await Student.findOne({ email: studentUser.email });
            if (student && student.rollNumber) {
              reportObj.rollNumber = student.rollNumber;
            }
          }
          
          // Update company name from CompanyProfile to ensure it shows the 3rd step registration name
          const CompanyProfile = require('../models/CompanyProfile');
          const companyProfile = await CompanyProfile.findOne({ user: report.companyId });
          if (companyProfile && companyProfile.companyName) {
            reportObj.companyName = companyProfile.companyName;
          }
        } catch (err) {
          console.error('Error fetching student/company data for report:', err);
        }
        return reportObj;
      })
    );

    res.json({
      success: true,
      data: reportsWithCorrectData
    });
  } catch (error) {
    console.error('Get company progress reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress reports',
      error: error.message
    });
  }
};

const getSupervisorReports = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    
    const reports = await ProgressReport.find({
      supervisorId: supervisorId
    }).sort({ createdAt: -1 });

    // Update company names from CompanyProfile to ensure they show the 3rd step registration name
    const CompanyProfile = require('../models/CompanyProfile');
    const reportsWithCorrectNames = await Promise.all(
      reports.map(async (report) => {
        const reportObj = report.toObject();
        try {
          const companyProfile = await CompanyProfile.findOne({ user: report.companyId });
          if (companyProfile && companyProfile.companyName) {
            reportObj.companyName = companyProfile.companyName;
          }
        } catch (err) {
          console.error('Error fetching company profile for report:', err);
        }
        return reportObj;
      })
    );

    res.json({
      success: true,
      data: reportsWithCorrectNames
    });
  } catch (error) {
    console.error('Get supervisor progress reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress reports',
      error: error.message
    });
  }
};

const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { supervisorFeedback } = req.body;
    const supervisorId = req.user.id;

    if (!supervisorFeedback || supervisorFeedback.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Supervisor feedback is required'
      });
    }

    const report = await ProgressReport.findOneAndUpdate(
      { _id: reportId, supervisorId: supervisorId },
      {
        supervisorFeedback,
        status: 'Reviewed',
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Report reviewed successfully',
      data: report
    });
  } catch (error) {
    console.error('Review progress report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review progress report',
      error: error.message
    });
  }
};

const downloadProgressReportPDF = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await ProgressReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 72 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="progress_report_${reportId}.pdf"`);
    
    doc.pipe(res);
    
    // Header
    doc.rect(72, 72, doc.page.width - 144, 40).fill('#003366'); // COMSATS Blue
    doc.fontSize(16).fillColor('#ffffff').text('COMSATS INTERNSHIP PORTAL', 72, 87, { align: 'center', width: doc.page.width - 144 });
    doc.moveDown(3);
    
    // Title
    doc.fontSize(18).fillColor('#111827').text('PROGRESS REPORT', { align: 'center' });
    doc.moveDown(2);
    
    // Student Info Table
    const startY = doc.y;
    const cellHeight = 25;
    const col1Width = 150;
    const col2Width = doc.page.width - 144 - col1Width;
    
    const tableData = [
      ['Student Name', `${report.studentName} (${report.rollNumber})`],
      ['Company Name', report.companyName],
      ['Supervisor Name', report.supervisorName],
      ['Reporting Period', report.reportingPeriod],
      ['Report Date', new Date(report.createdAt).toLocaleDateString()],
      ['Status', report.status]
    ];
    
    tableData.forEach((row, index) => {
      const y = startY + (index * cellHeight);
      
      // Header cell
      doc.rect(72, y, col1Width, cellHeight).fillAndStroke('#f3f4f6', '#e5e7eb');
      doc.fontSize(11).fillColor('#374151').text(row[0], 82, y + 8, { width: col1Width - 20 });
      
      // Data cell
      doc.rect(72 + col1Width, y, col2Width, cellHeight).fillAndStroke('#f9fafb', '#e5e7eb');
      doc.fontSize(11).fillColor('#111827').text(row[1], 82 + col1Width, y + 8, { width: col2Width - 20 });
    });
    
    doc.y = startY + (tableData.length * cellHeight) + 20;
    
    // Content sections
    const addSection = (title, content) => {
      doc.fontSize(14).fillColor('#111827').text(title, 72, doc.y, { underline: true });
      doc.moveDown(0.5);
      doc.rect(72, doc.y, doc.page.width - 144, 2).fill('#e5e7eb');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#374151').text(content || 'Not specified', 72, doc.y, { 
        width: doc.page.width - 144,
        lineBreak: true
      });
      doc.moveDown(1);
    };
    
    addSection('Tasks Assigned', report.tasksAssigned);
    addSection('Progress Made', report.progressMade);
    
    if (report.areasOfImprovement) {
      addSection('Areas of Improvement', report.areasOfImprovement);
    }
    
    if (report.nextGoals) {
      addSection('Next Goals / Objectives', report.nextGoals);
    }
    
    if (report.remarks) {
      addSection('Remarks / Notes', report.remarks);
    }
    
    if (report.supervisorFeedback) {
      addSection('Supervisor Feedback', report.supervisorFeedback);
    }
    
    // Footer
    const footerY = doc.page.height - 50;
    doc.rect(72, footerY - 10, doc.page.width - 144, 30).fill('#f3f4f6');
    doc.fontSize(9).fillColor('#6b7280');
    doc.text('Generated by COMSATS Internship Portal', 82, footerY, { width: 200 });
    doc.text(`Page 1 | ${new Date().toLocaleDateString()}`, doc.page.width - 200, footerY, { width: 120, align: 'right' });
    
    doc.end();
  } catch (error) {
    console.error('Download progress report PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
};

const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await ProgressReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get progress report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress report',
      error: error.message
    });
  }
};

module.exports = {
  createProgressReport,
  getCompanyReports,
  getSupervisorReports,
  reviewReport,
  downloadProgressReportPDF,
  getReportById
};