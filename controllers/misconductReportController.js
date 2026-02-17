const mongoose = require('mongoose');
const MisconductReport = require('../models/MisconductReport');
const Student = require('../models/Student');
const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');

const createMisconductReport = async (req, res) => {
  try {
    console.log('=== CREATE MISCONDUCT REPORT ===');
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);
    
    const { studentId, issueType, incidentDate, description } = req.body;
    const companyUserId = req.user.id;

    // Validate required fields
    if (!studentId || studentId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    if (description.length < 200) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 200 characters long'
      });
    }

    // First, verify that this company has hired this student
    const Application = require('../models/Application');
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

    // Get student information from the User collection 
    const studentUser = await User.findById(studentId);
    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Student user not found'
      });
    }

    // Find the student's profile in Student collection to get supervisor info
    const student = await Student.findOne({ email: studentUser.email }).populate('selectedSupervisorId', 'name email');
    
    if (!student || !student.selectedSupervisorId) {
      return res.status(400).json({
        success: false,
        message: 'Student does not have an assigned supervisor'
      });
    }

    // Validate company user
    const companyUser = await User.findById(companyUserId);
    console.log('Company user lookup result:', companyUser ? 'Found' : 'Not found');
    
    if (!companyUser) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Get company profile for additional details, fallback to user name
    const companyProfile = await CompanyProfile.findOne({ user: companyUserId });
    const companyName = companyProfile?.companyName || companyUser.name || 'Unknown Company';
    console.log('Company name resolved to:', companyName);

    const report = new MisconductReport({
      studentId,
      studentName: student.fullName, // Use fullName from Student collection
      rollNumber: student.rollNumber || null, // Add roll number from Student collection
      companyId: companyUserId,
      companyName: companyName,
      supervisorId: student.selectedSupervisorId._id,
      supervisorName: student.selectedSupervisorId.name,
      issueType,
      incidentDate,
      description
    });

    await report.save();
    console.log('Report saved successfully:', report._id);

    // Send notification to supervisor
    try {
      const Notification = require('../models/Notification');
      
      await Notification.create({
        userId: student.selectedSupervisorId._id,
        type: 'company_misconduct_report',
        title: 'New Company Misconduct Report',
        message: `${companyName} has submitted a misconduct report for student ${student.fullName} regarding ${issueType}`,
        actionUrl: '/supervisor-dashboard?tab=company-reports',
        isRead: false
      });
      
      console.log('Notification sent to supervisor:', student.selectedSupervisorId.name);
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the report creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Misconduct report created successfully and sent to supervisor',
      data: report
    });
  } catch (error) {
    console.error('Create misconduct report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create misconduct report',
      error: error.message
    });
  }
};

const getSupervisedStudents = async (req, res) => {
  try {
    console.log('=== GET SUPERVISED STUDENTS ===');
    console.log('Request headers authorization:', req.headers.authorization);
    console.log('User from token:', req.user);
    
    const companyUserId = req.user.id;
    console.log('Getting students with accepted offer letters for company:', companyUserId);
    console.log('Company name:', req.user.name);
    console.log('Company email:', req.user.email);
    
    const OfferLetter = require('../models/OfferLetter');
    
    // First, let's see what offer letters exist for this company
    console.log('🔍 Checking all offer letters for this company...');
    const allOffers = await OfferLetter.find({ companyId: companyUserId });
    console.log('Total offer letters for this company:', allOffers.length);
    allOffers.forEach((offer, index) => {
      console.log(`  ${index + 1}. Status: ${offer.status}, Student Response: ${offer.studentResponse?.response}, Student ID: ${offer.studentId}`);
    });
    
    // Find students who have ACCEPTED offer letters from this company
    // Check both status field and studentResponse.response field
    const acceptedOfferLetters = await OfferLetter.find({
      companyId: companyUserId,
      $or: [
        { status: 'accepted' },
        { 'studentResponse.response': 'accepted' }
      ]
    }).populate('studentId', 'name email');
    
    console.log('Found accepted offer letters:', acceptedOfferLetters.length);
    
    // Extract unique students who have accepted offer letters
    const acceptedStudents = acceptedOfferLetters
      .map(offer => ({
        _id: offer.studentId._id,
        name: offer.studentName,
        email: offer.studentEmail,
        jobTitle: offer.jobTitle
      }))
      .filter(student => student !== null);
    
    // Remove duplicates based on student ID
    const uniqueStudents = acceptedStudents.filter((student, index, self) => 
      index === self.findIndex(s => s._id.toString() === student._id.toString())
    );
    
    console.log('Unique students with accepted offers:', uniqueStudents.length);
    
    res.json({
      success: true,
      data: uniqueStudents
    });
  } catch (error) {
    console.error('Get supervised students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supervised students',
      error: error.message
    });
  }
};

const getSupervisorReports = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    console.log('Getting misconduct reports for supervisor:', supervisorId);
    
    // Get all misconduct reports where this supervisor is assigned
    const reports = await MisconductReport.find({
      supervisorId: supervisorId
    }).sort({ createdAt: -1 });

    console.log(`Found ${reports.length} misconduct reports for supervisor`);

    // Update company names from CompanyProfile to ensure they show the 3rd step registration name
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
    console.error('Get supervisor reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch misconduct reports',
      error: error.message
    });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, supervisorComments } = req.body;
    const supervisorId = req.user.id;

    // Validate status values
    const validStatuses = ['Pending', 'Resolved', 'Warning Issued', 'Internship Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    if (!supervisorComments || supervisorComments.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Supervisor comments are required'
      });
    }

    const updateData = {
      status,
      supervisorComments,
      resolvedAt: new Date()
    };

    const report = await MisconductReport.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Create notifications
    try {
      const Notification = require('../models/Notification');
      
      // Notification messages based on status
      const statusMessages = {
        'Resolved': 'Your misconduct report was resolved. No further action required.',
        'Warning Issued': 'Your misconduct report has been reviewed. Status: Warning Issued. Please meet your supervisor.',
        'Internship Cancelled': 'Your internship has been cancelled due to misconduct. Contact supervisor.'
      };

      // Notify student
      if (statusMessages[status]) {
        await Notification.create({
          userId: report.studentId,
          type: 'misconduct_update',
          title: 'Misconduct Report Update',
          message: statusMessages[status],
          actionUrl: '/student-dashboard?tab=reports-view',
          isRead: false
        });
      }

      // Notify company
      await Notification.create({
        userId: report.companyId,
        type: 'misconduct_update',
        title: 'Misconduct Report Updated',
        message: `Supervisor has updated the status of misconduct report for ${report.studentName} to: ${status}`,
        actionUrl: '/company-dashboard?tab=reports',
        isRead: false
      });
      
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
    }

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message
    });
  }
};

const getEligibleStudents = async (req, res) => {
  try {
    const { companyId } = req.params;
    const requestingCompanyId = req.user.id;
    
    console.log('=== GET ELIGIBLE STUDENTS ===');
    console.log('Company ID from params:', companyId);
    console.log('Requesting company ID from token:', requestingCompanyId);
    
    // Ensure company can only access their own hired students
    if (companyId !== requestingCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const Application = require('../models/Application');
    
    // Find applications where company hired the student
    const hiredApplications = await Application.find({
      companyId: requestingCompanyId,
      applicationStatus: 'hired'
    });

    console.log(`Found ${hiredApplications.length} hired applications`);

    if (hiredApplications.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No hired students found'
      });
    }

    // Extract student details with job title using the correct field names
    const eligibleStudents = hiredApplications.map(app => {
      console.log('Processing application:', {
        id: app._id,
        studentId: app.studentId,
        studentName: app.studentName,
        studentEmail: app.studentEmail,
        rollNumber: app.studentProfile?.rollNumber
      });
      
      return {
        _id: app.studentId,
        name: app.studentName,
        rollNumber: app.studentProfile?.rollNumber || 'N/A',
        email: app.studentEmail,
        jobTitle: app.jobTitle
      };
    });

    // Remove duplicates based on student ID
    const uniqueStudents = eligibleStudents.filter((student, index, self) => 
      index === self.findIndex(s => s._id.toString() === student._id.toString())
    );

    console.log(`Returning ${uniqueStudents.length} unique eligible students`);

    res.json({
      success: true,
      data: uniqueStudents
    });
  } catch (error) {
    console.error('Get eligible students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch eligible students',
      error: error.message
    });
  }
};

const getCompanyReports = async (req, res) => {
  try {
    const { companyId } = req.params;
    const requestingCompanyId = req.user.id;
    
    // Ensure company can only access their own reports
    if (companyId !== requestingCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const reports = await MisconductReport.find({
      companyId: requestingCompanyId
    }).sort({ createdAt: -1 });

    // Get student details and company name from respective models
    const formattedReports = await Promise.all(reports.map(async (report) => {
      let rollNumber = report.rollNumber || 'N/A';
      let companyName = report.companyName;
      
      try {
        // Get student user to find their email
        const studentUser = await User.findById(report.studentId);
        if (studentUser) {
          // Get student profile to fetch roll number
          const student = await Student.findOne({ email: studentUser.email });
          if (student && student.rollNumber) {
            rollNumber = student.rollNumber;
          }
        }
        
        // Update company name from CompanyProfile
        const companyProfile = await CompanyProfile.findOne({ user: report.companyId });
        if (companyProfile && companyProfile.companyName) {
          companyName = companyProfile.companyName;
        }
      } catch (err) {
        console.error('Error fetching student/company data:', err);
      }
      
      return {
        _id: report._id,
        studentName: report.studentName,
        rollNumber: rollNumber,
        companyName: companyName,
        issueType: report.issueType,
        incidentDate: report.incidentDate,
        status: report.status === 'Pending' ? 'Pending Review' : report.status,
        description: report.description,
        createdAt: report.createdAt
      };
    }));

    res.json({
      success: true,
      data: formattedReports
    });
  } catch (error) {
    console.error('Get company reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company reports',
      error: error.message
    });
  }
};

const getStudentReports = async (req, res) => {
  try {
    const { studentId } = req.params;
    const requestingUserId = req.user.id;
    
    // Ensure student can only access their own reports
    if (studentId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const reports = await MisconductReport.find({
      studentId: requestingUserId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get student reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student reports',
      error: error.message
    });
  }
};

const downloadReportPDF = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await MisconductReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="misconduct_report_${reportId}.pdf"`);
    
    doc.pipe(res);

    // COMSATS Blue Colors
    const COMSATS_BLUE = [0, 51, 102]; // #003366
    const COMSATS_LIGHT_BLUE = [0, 80, 158]; // #00509E
    const LIGHT_BG = [243, 244, 246];
    const VERY_LIGHT_BG = [254, 242, 242];

    // Header Banner - COMSATS Blue
    doc.rect(0, 0, 612, 100).fillAndStroke(COMSATS_BLUE, COMSATS_BLUE);
    
    doc.fontSize(24).fillColor('#FFFFFF').font('Helvetica-Bold');
    doc.text('MISCONDUCT REPORT', 50, 30, { align: 'center', width: 512 });
    
    doc.fontSize(11).font('Helvetica');
    doc.text('Student Behavior Incident Documentation', 50, 65, { align: 'center', width: 512 });

    // Report ID and Date box
    doc.rect(60, 120, 492, 30).fillAndStroke([255, 243, 205], [245, 158, 11]);
    doc.fontSize(10).fillColor([180, 83, 9]).font('Helvetica-Bold');
    doc.text(`Report ID: MR-${new Date().getFullYear()}-${reportId.slice(-4).toUpperCase()}`, 75, 130);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 380, 130);

    // Divider
    doc.moveTo(60, 170).lineTo(552, 170).stroke(COMSATS_BLUE);

    // Issue Type and Status Boxes
    const boxY = 190;
    
    // Issue Type Box
    doc.rect(60, boxY, 220, 60).fillAndStroke(VERY_LIGHT_BG, [220, 38, 38]);
    doc.fontSize(14).fillColor([220, 38, 38]).font('Helvetica-Bold');
    doc.text(report.issueType || 'Unprofessional Behavior', 70, boxY + 10, { width: 200, align: 'center' });
    doc.fontSize(9).fillColor([127, 29, 29]).font('Helvetica');
    doc.text('ISSUE TYPE', 70, boxY + 35, { width: 200, align: 'center' });

    // Status Box
    const statusColors = {
      'Resolved': { bg: [220, 252, 231], border: [22, 163, 74], text: [21, 128, 61] },
      'Pending': { bg: [254, 249, 195], border: [234, 179, 8], text: [161, 98, 7] },
      'Warning Issued': { bg: [254, 243, 199], border: [251, 146, 60], text: [194, 65, 12] },
      'Internship Cancelled': { bg: [254, 226, 226], border: [239, 68, 68], text: [153, 27, 27] }
    };
    const statusStyle = statusColors[report.status] || statusColors['Pending'];
    
    doc.rect(300, boxY, 252, 60).fillAndStroke(statusStyle.bg, statusStyle.border);
    doc.fontSize(14).fillColor(statusStyle.text).font('Helvetica-Bold');
    doc.text(report.status || 'Resolved', 310, boxY + 10, { width: 232, align: 'center' });
    doc.fontSize(9).fillColor(statusStyle.text).font('Helvetica');
    doc.text('CURRENT STATUS', 310, boxY + 35, { width: 232, align: 'center' });

    // Incident Information Section
    let yPos = 280;
    doc.fontSize(12).fillColor(COMSATS_BLUE).font('Helvetica-Bold');
    doc.text('Incident Information', 60, yPos);
    yPos += 25;

    // Student & Incident Details Table
    doc.rect(60, yPos, 492, 20).fillAndStroke([230, 243, 255], COMSATS_BLUE);
    doc.fontSize(10).fillColor(COMSATS_BLUE).font('Helvetica-Bold');
    doc.text('STUDENT & INCIDENT DETAILS', 70, yPos + 6);
    yPos += 25;

    const detailsData = [
      ['Student Name', report.studentName || 'N/A'],
      ['Roll Number', report.rollNumber || 'N/A'],
      ['Company Name', report.companyName || 'N/A'],
      ['Issue Type', report.issueType || 'N/A'],
      ['Incident Date', new Date(report.incidentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
      ['Reported On', new Date(report.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]
    ];

    detailsData.forEach((row, index) => {
      if (index % 2 === 0) {
        doc.rect(60, yPos, 492, 18).fillAndStroke([249, 250, 251], [229, 231, 235]);
      }
      doc.fontSize(9).fillColor([55, 65, 81]).font('Helvetica-Bold');
      doc.text(row[0], 70, yPos + 5, { width: 150 });
      doc.fontSize(9).fillColor([17, 24, 39]).font('Helvetica');
      doc.text(row[1], 230, yPos + 5, { width: 312 });
      yPos += 18;
    });

    yPos += 10;

    // Description Section
    doc.fontSize(11).fillColor(COMSATS_BLUE).font('Helvetica-Bold');
    doc.text('Detailed Description:', 60, yPos);
    yPos += 20;

    doc.rect(60, yPos, 492, 2).fill(COMSATS_LIGHT_BLUE);
    yPos += 10;

    doc.fontSize(10).fillColor([55, 65, 81]).font('Helvetica');
    const descriptionText = report.description || 'No description provided.';
    doc.text(descriptionText, 60, yPos, { width: 492, align: 'justify', lineGap: 3 });
    yPos = doc.y + 15;

    // Supervisor Comments if available
    if (report.supervisorComments) {
      doc.fontSize(11).fillColor(COMSATS_BLUE).font('Helvetica-Bold');
      doc.text('Supervisor Comments:', 60, yPos);
      yPos += 20;

      doc.rect(60, yPos, 492, 2).fill(COMSATS_LIGHT_BLUE);
      yPos += 10;

      doc.fontSize(10).fillColor([55, 65, 81]).font('Helvetica');
      doc.text(report.supervisorComments, 60, yPos, { width: 492, align: 'justify', lineGap: 3 });
    }

    // Footer
    const footerY = 750;
    doc.rect(60, footerY, 492, 30).fillAndStroke(LIGHT_BG, [209, 213, 219]);
    doc.fontSize(8).fillColor([107, 114, 128]).font('Helvetica');
    doc.text('Generated by COMSATS Internship Portal', 70, footerY + 10);
    doc.text(`Page 1`, 500, footerY + 10);

    doc.end();
  } catch (error) {
    console.error('Download misconduct report PDF error:', error);
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
    const report = await MisconductReport.findById(reportId);

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
    console.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
};

module.exports = {
  createMisconductReport,
  getSupervisedStudents,
  getEligibleStudents,
  getCompanyReports,
  getSupervisorReports,
  getStudentReports,
  updateReportStatus,
  downloadReportPDF,
  getReportById
};