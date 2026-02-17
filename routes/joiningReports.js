const express = require('express');
const router = express.Router();
const { auth, hasRole } = require('../middleware/auth');
const {
  createJoiningReport,
  getStudentJoiningReport,
  getSupervisorJoiningReports,
  verifyJoiningReport,
  getJoiningReportById,
  checkJoiningReportEligibility
} = require('../controllers/joiningReportController');

// Student routes
router.post('/create', auth, hasRole('student'), createJoiningReport);
router.get('/student', auth, hasRole('student'), getStudentJoiningReport);
router.get('/eligibility', auth, hasRole('student'), checkJoiningReportEligibility);

// Supervisor routes
router.get('/supervisor', auth, hasRole('supervisor'), getSupervisorJoiningReports);
router.patch('/:reportId/verify', auth, hasRole('supervisor'), verifyJoiningReport);

// Common routes
router.get('/:reportId', auth, getJoiningReportById);

// Enhanced PDF generation route with COMSATS branding using PDF Generator utility
router.get('/:reportId/pdf', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const JoiningReport = require('../models/JoiningReport');
    const PDFDocument = require('pdfkit');
    
    const report = await JoiningReport.findById(reportId)
      .populate('studentId', 'name email')
      .populate('companyId', 'name company.companyName')
      .populate('supervisorId', 'name email');
    
    // Get company profile for proper company name (3rd step registration)
    let companyProfile = null;
    if (report.companyId) {
      const CompanyProfile = require('../models/CompanyProfile');
      companyProfile = await CompanyProfile.findOne({ user: report.companyId._id });
    }

    // Get actual position and department from Application and Job models
    const Application = require('../models/Application');
    const Job = require('../models/Job');
    
    const application = await Application.findOne({
      studentId: report.studentId._id,
      applicationStatus: 'hired'
    }).populate('jobId', 'jobTitle');
    
    const actualPosition = application?.jobId?.jobTitle || report.position || 'Not Specified';
    const actualDepartment = application?.studentProfile?.department || report.department || 'N/A';
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify user has permission to download this report
    if (req.user.role === 'student' && report.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to download this report' });
    }

    // Create PDF document with A4 size
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Joining_Report_${report.studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Helper functions
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    };

    const getCompanyName = () => {
      return companyProfile?.companyName || 
             report.companyId?.company?.companyName || 
             report.companyName || 
             'N/A';
    };

    // PAGE WIDTH: 595.28 points (A4)
    // MARGINS: 40 points left and right = 515.28 usable width
    const pageWidth = 595.28;
    const leftMargin = 40;
    const rightMargin = 40;
    const usableWidth = pageWidth - leftMargin - rightMargin; // 515.28
    const cardWidth = (usableWidth - 20) / 2; // Split into 2 columns with gap
    const columnGap = 20;

    // Header - Blue background with white text
    doc.rect(0, 0, pageWidth, 80).fill('#003366');
    doc.fillColor('#FFFFFF');
    doc.fontSize(22).font('Helvetica-Bold').text('Joining Report', leftMargin, 20, { width: usableWidth });
    doc.fontSize(11).font('Helvetica').text(
      `${report.studentName} • Submitted on ${formatDate(report.reportDate)}`,
      leftMargin,
      50,
      { width: usableWidth }
    );

    let yPosition = 100;

    // ========== STUDENT INFORMATION CARD (LEFT) ==========
    const leftX = leftMargin;
    const rightX = leftMargin + cardWidth + columnGap;

    // Student Information Card Border
    doc.rect(leftX, yPosition, cardWidth, 130).stroke({ color: '#E0E0E0', width: 1 });
    doc.rect(leftX + 1, yPosition + 1, cardWidth - 2, 128).fill('#F9F9F9');

    // Card Header
    doc.fillColor('#003366').fontSize(12).font('Helvetica-Bold').text('Student Information', leftX + 8, yPosition + 10, { width: cardWidth - 16 });
    
    // Divider line
    doc.moveTo(leftX + 8, yPosition + 28).lineTo(leftX + cardWidth - 8, yPosition + 28).stroke('#E0E0E0');

    // Field 1: Student Name
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text('Student Name:', leftX + 8, yPosition + 38, { width: cardWidth - 16 });
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text(
      report.studentName || 'N/A',
      leftX + 8,
      yPosition + 50,
      { width: cardWidth - 16 }
    );

    // Field 2: Roll Number
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text('Roll Number:', leftX + 8, yPosition + 66, { width: cardWidth - 16 });
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text(
      report.rollNumber || 'N/A',
      leftX + 8,
      yPosition + 78,
      { width: cardWidth - 16 }
    );

    // Field 3: Email
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text('Email:', leftX + 8, yPosition + 94, { width: cardWidth - 16 });
    doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text(
      report.studentId?.email || 'N/A',
      leftX + 8,
      yPosition + 106,
      { width: cardWidth - 16, lineBreak: true }
    );

    // ========== COMPANY DETAILS CARD (RIGHT) ==========
    
    // Company Details Card Border
    doc.rect(rightX, yPosition, cardWidth, 130).stroke({ color: '#E0E0E0', width: 1 });
    doc.rect(rightX + 1, yPosition + 1, cardWidth - 2, 128).fill('#F9F9F9');

    // Card Header
    doc.fillColor('#003366').fontSize(12).font('Helvetica-Bold').text('Company Details', rightX + 8, yPosition + 10, { width: cardWidth - 16 });
    
    // Divider line
    doc.moveTo(rightX + 8, yPosition + 28).lineTo(rightX + cardWidth - 8, yPosition + 28).stroke('#E0E0E0');

    // Field 1: Company Name
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text('Company Name:', rightX + 8, yPosition + 38, { width: cardWidth - 16 });
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text(
      getCompanyName(),
      rightX + 8,
      yPosition + 50,
      { width: cardWidth - 50 }
    );

    // Field 2: Position
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text('Position:', rightX + 8, yPosition + 66, { width: cardWidth - 16 });
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text(
      actualPosition,
      rightX + 8,
      yPosition + 78,
      { width: cardWidth - 16 }
    );

    // Field 3: Department & Status
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text('Department:', rightX + 8, yPosition + 94, { width: cardWidth - 50 });
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text(
      actualDepartment,
      rightX + 8,
      yPosition + 106,
      { width: cardWidth - 50 }
    );

    // Status Badge (inline on the right)
    const statusText = report.status?.charAt(0).toUpperCase() + report.status?.slice(1) || 'Pending';
    const statusWidth = 50;
    const statusX = rightX + cardWidth - statusWidth - 8;
    const statusY = yPosition + 100;
    
    doc.rect(statusX, statusY, statusWidth, 18).fill('#E8F5E9').stroke({ color: '#4CAF50', width: 0.5 });
    doc.fillColor('#2E7D32').fontSize(8).font('Helvetica-Bold').text(
      statusText,
      statusX + 2,
      statusY + 4,
      { width: statusWidth - 4, align: 'center' }
    );

    yPosition += 150;

    // ========== STUDENT THOUGHTS & EXPERIENCE ==========
    if (report.studentThoughts && report.studentThoughts.trim()) {
      // Section Box
      doc.rect(leftMargin, yPosition, usableWidth, 80).stroke({ color: '#E0E0E0', width: 1 });
      doc.rect(leftMargin + 1, yPosition + 1, usableWidth - 2, 80 - 2).fill('#F9F9F9');

      // Section Header
      doc.fillColor('#003366').fontSize(12).font('Helvetica-Bold').text(
        'Student Thoughts & Experience',
        leftMargin + 8,
        yPosition + 8,
        { width: usableWidth - 16 }
      );
      
      // Divider
      doc.moveTo(leftMargin + 8, yPosition + 25).lineTo(leftMargin + usableWidth - 8, yPosition + 25).stroke('#E0E0E0');

      // Content box
      doc.rect(leftMargin + 8, yPosition + 32, usableWidth - 16, 40).stroke({ color: '#E0E0E0', width: 1 }).fill('#FFFFFF');
      
      doc.fillColor('#333333').fontSize(10).font('Helvetica').text(
        report.studentThoughts,
        leftMargin + 12,
        yPosition + 36,
        { width: usableWidth - 24, align: 'left', lineBreak: true }
      );

      yPosition += 95;
    }

    // ========== REPORT TIMELINE ==========
    doc.rect(leftMargin, yPosition, usableWidth, 90).stroke({ color: '#E0E0E0', width: 1 });
    doc.rect(leftMargin + 1, yPosition + 1, usableWidth - 2, 90 - 2).fill('#F9F9F9');

    // Section Header
    doc.fillColor('#003366').fontSize(12).font('Helvetica-Bold').text(
      'Report Timeline',
      leftMargin + 8,
      yPosition + 8,
      { width: usableWidth - 16 }
    );
    
    // Divider
    doc.moveTo(leftMargin + 8, yPosition + 25).lineTo(leftMargin + usableWidth - 8, yPosition + 25).stroke('#E0E0E0');

    // Timeline Item 1: Report Submitted - Blue dot
    const dotX = leftMargin + 20;
    const item1Y = yPosition + 35;
    
    doc.circle(dotX, item1Y, 4).fill('#1976D2');
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('Report Submitted', dotX + 15, item1Y - 5, { width: usableWidth - 100 });
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text(
      formatDateTime(report.reportDate),
      dotX + 15,
      item1Y + 7,
      { width: usableWidth - 100 }
    );

    // Timeline Item 2: Report Verified - Green dot (if applicable)
    if (report.status === 'verified' || report.status === 'Verified') {
      const item2Y = yPosition + 60;
      
      doc.circle(dotX, item2Y, 4).fill('#4CAF50');
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('Report Verified', dotX + 15, item2Y - 5, { width: usableWidth - 100 });
      doc.fillColor('#666666').fontSize(9).font('Helvetica').text(
        'Verified by supervisor',
        dotX + 15,
        item2Y + 7,
        { width: usableWidth - 100 }
      );
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate PDF', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
      });
    }
  }
});module.exports = router;