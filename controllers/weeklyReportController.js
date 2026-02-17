const WeeklyReportEvent = require('../models/WeeklyReportEvent');
const WeeklyReport = require('../models/WeeklyReport');
const Student = require('../models/Student');
const User = require('../models/User');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const { generateWeeklyReportPDF } = require('../utils/weeklyReportPdf');
const { COMSATSWeeklyReportPDFGenerator } = require('../utils/professionalWeeklyReportPdf');
const fs = require('fs');
const path = require('path');

const weeklyReportController = {
  // Supervisor creates a weekly report event
  createEvent: async (req, res) => {
    try {
      const { weekNumber, title, instructions, dueDate } = req.body;
      const supervisorId = req.user.id;
      const supervisorName = req.user.name;

      // Validate required fields
      if (!weekNumber || !dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Week number and due date are required'
        });
      }

      // Validate week number range
      if (weekNumber < 1 || weekNumber > 12) {
        return res.status(400).json({
          success: false,
          message: 'Week number must be between 1 and 12'
        });
      }

      // Check if event already exists for this week
      const existingEvent = await WeeklyReportEvent.findOne({
        supervisorId,
        weekNumber
      });

      if (existingEvent) {
        return res.status(409).json({
          success: false,
          message: `Weekly report event for Week ${weekNumber} already exists`
        });
      }

      // Calculate week start date (7 days before due date as default)
      const dueDateObj = new Date(dueDate);
      const weekStartDate = new Date(dueDateObj);
      weekStartDate.setDate(weekStartDate.getDate() - 7);

      // Create the event
      const reportEvent = new WeeklyReportEvent({
        supervisorId,
        supervisorName,
        weekNumber,
        title: title || `Weekly Report - Week ${weekNumber}`,
        instructions: instructions || '',
        weekStartDate: weekStartDate,
        dueDate: new Date(dueDate)
      });

      await reportEvent.save();

      // Find all students with approved applications under this supervisor
      const approvedApplications = await Application.find({
        supervisorId: supervisorId,
        supervisorStatus: 'approved'
      }).populate('studentId', 'name email');

      // Create notifications for all assigned students
      const notificationPromises = approvedApplications.map(async (application) => {
        if (application.studentId) {
          // Create notification
          await Notification.createStudentNotification(
            application.studentId._id,
            'weekly_report_assigned',
            `Weekly Report Request - Week ${weekNumber}`,
            `Your supervisor has requested Week ${weekNumber} report. Due: ${new Date(dueDate).toLocaleDateString()}`,
            `/dashboard/student?tab=reports`,
            supervisorId
          );

          // Track notification in the event
          reportEvent.notifiedStudents.push({
            studentId: student.userId._id,
            notificationSent: true,
            notificationDate: new Date()
          });
        }
      });

      await Promise.all(notificationPromises);
      await reportEvent.save();

      res.status(201).json({
        success: true,
        message: `Weekly report event created successfully. ${assignedStudents.length} students notified.`,
        data: {
          event: reportEvent,
          studentsNotified: assignedStudents.length
        }
      });

    } catch (error) {
      console.error('Error creating weekly report event:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create weekly report event',
        error: error.message
      });
    }
  },

  // Get all events created by a supervisor
  getSupervisorEvents: async (req, res) => {
    try {
      const supervisorId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      const query = { supervisorId };
      if (status) {
        query.status = status;
      }

      const events = await WeeklyReportEvent.find(query)
        .sort({ weekNumber: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await WeeklyReportEvent.countDocuments(query);

      // Get submission counts for each event
      const eventsWithStats = await Promise.all(events.map(async (event) => {
        const submissionCount = await WeeklyReport.countDocuments({
          weekEventId: event._id
        });

        const reviewedCount = await WeeklyReport.countDocuments({
          weekEventId: event._id,
          status: 'reviewed'
        });

        return {
          ...event.toObject(),
          submissions: {
            total: submissionCount,
            reviewed: reviewedCount,
            pending: submissionCount - reviewedCount
          }
        };
      }));

      res.json({
        success: true,
        data: {
          events: eventsWithStats,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: events.length,
            totalRecords: total
          }
        }
      });

    } catch (error) {
      console.error('Error fetching supervisor events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weekly report events',
        error: error.message
      });
    }
  },

  // Get pending report events for a student
  getStudentPendingEvents: async (req, res) => {
    try {
      const studentId = req.user.id;
      console.log(`📚 getStudentPendingEvents called for student: ${studentId}`);

      // Find the student's approved application to get their supervisor
      const approvedApplication = await Application.findOne({
        studentId: studentId,
        supervisorStatus: 'approved'
      }).populate('supervisorId', 'name email');
      console.log(`📋 Found approved application:`, approvedApplication ? {
        id: approvedApplication._id,
        studentId: approvedApplication.studentId,
        supervisorId: approvedApplication.supervisorId?._id,
        supervisorName: approvedApplication.supervisorId?.name,
        supervisorStatus: approvedApplication.supervisorStatus
      } : 'No approved application found');

      if (!approvedApplication) {
        console.log(`❌ No approved application found for student ${studentId}`);
        return res.json({
          success: true,
          data: {
            events: [],
            message: 'No approved internship application found'
          }
        });
      }

      // Get active events from the supervisor
      const events = await WeeklyReportEvent.find({
        supervisorId: approvedApplication.supervisorId._id,
        status: 'active'
      }).sort({ weekNumber: 1 });
      console.log(`📅 Found ${events.length} active events from supervisor ${approvedApplication.supervisorId.name}`);

      // Check which events have been submitted by this student
      const eventsWithStatus = await Promise.all(events.map(async (event) => {
        const existingSubmission = await WeeklyReport.findOne({
          studentId: studentId,
          weekEventId: event._id
        });

        return {
          ...event.toObject(),
          submissionStatus: existingSubmission ? existingSubmission.status : 'pending',
          submittedAt: existingSubmission ? existingSubmission.submittedAt : null,
          reportId: existingSubmission ? existingSubmission._id : null,
          isSubmitted: !!existingSubmission,
          canSubmit: !existingSubmission && new Date() <= event.dueDate,
          isOverdue: !existingSubmission && new Date() > event.dueDate
        };
      }));

      console.log(`📤 Returning ${eventsWithStatus.length} events with status for student ${studentId}`);
      console.log('Events details:', eventsWithStatus.map(e => ({
        id: e._id,
        title: e.title,
        weekNumber: e.weekNumber,
        dueDate: e.dueDate,
        submissionStatus: e.submissionStatus,
        isSubmitted: e.isSubmitted
      })));

      res.json({
        success: true,
        data: {
          events: eventsWithStatus,
          supervisor: approvedApplication.supervisorId
        }
      });

    } catch (error) {
      console.error('Error fetching student pending events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending report events',
        error: error.message
      });
    }
  },

  // Simple weekly report submission (no events required)
  submitSimpleReport: async (req, res) => {
    try {
      const { 
        weekNumber,
        tasksCompleted, 
        reflections,
        additionalComments
      } = req.body;
      const studentId = req.user.id;
      const uploadedFiles = req.files || [];

      console.log('📝 Simple Weekly Report Submission:', {
        weekNumber,
        studentId,
        body: req.body,
        filesCount: uploadedFiles.length
      });

      // Validate required fields
      if (!weekNumber || !tasksCompleted || !reflections) {
        return res.status(400).json({
          success: false,
          message: 'Week number, weekly work summary, and reflections are required'
        });
      }

      // Validate week number
      const weekNum = parseInt(weekNumber);
      if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
        return res.status(400).json({
          success: false,
          message: 'Week number must be between 1 and 12'
        });
      }

      // Find student's approved application to get supervisor
      const approvedApplication = await Application.findOne({
        studentId: studentId,
        supervisorStatus: 'approved'
      }).populate('supervisorId', 'name email');

      if (!approvedApplication) {
        console.log('❌ No approved application found for student:', studentId);
        return res.status(404).json({
          success: false,
          message: 'No approved internship application found. Please get your application approved first.'
        });
      }

      console.log('✅ Found approved application:', approvedApplication._id);

      // Check if student has already submitted for this week
      const existingSubmission = await WeeklyReport.findOne({
        studentId: studentId,
        weekNumber: weekNum
      });

      if (existingSubmission) {
        return res.status(409).json({
          success: false,
          message: `You have already submitted a report for Week ${weekNum}`
        });
      }

      // Find or create a weekly report event for this week and supervisor
      let weeklyEvent = await WeeklyReportEvent.findOne({
        supervisorId: approvedApplication.supervisorId._id,
        weekNumber: weekNum
      });

      if (!weeklyEvent) {
        // Create a default weekly event if none exists
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days from now
        
        weeklyEvent = new WeeklyReportEvent({
          supervisorId: approvedApplication.supervisorId._id,
          supervisorName: approvedApplication.supervisorId.name,
          weekNumber: weekNum,
          title: `Weekly Report - Week ${weekNum}`,
          instructions: 'Please submit your weekly progress report.',
          dueDate: dueDate,
          status: 'active'
        });
        
        await weeklyEvent.save();
        console.log('✅ Created new weekly event:', weeklyEvent._id);
      }

      // Process uploaded files
      const supportingFiles = uploadedFiles.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/weekly-reports/${studentId}/${file.filename}`,
        uploadedAt: new Date()
      }));

      // Create the weekly report with all required fields
      const weeklyReport = new WeeklyReport({
        studentId,
        studentName: req.user.name,
        studentRollNo: req.user.rollNumber || req.user.email,
        supervisorId: approvedApplication.supervisorId._id,
        supervisorName: approvedApplication.supervisorId.name,
        weekEventId: weeklyEvent._id,
        weekNumber: weekNum,
        reportTitle: `Weekly Report - Week ${weekNum}`,
        tasksCompleted: tasksCompleted.trim(),
        challengesFaced: '', // Not required in simple form
        reflections: reflections.trim(),
        supportingMaterials: additionalComments?.trim() || '',
        supportingFiles: supportingFiles,
        plansForNextWeek: '', // Not required in simple form
        companyName: approvedApplication.companyName || '',
        companyLocation: approvedApplication.companyLocation || '',
        dueDate: weeklyEvent.dueDate,
        status: 'submitted',
        submittedAt: new Date(),
        submissionMetadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          submissionMethod: 'web'
        }
      });

      console.log('💾 Creating simple weekly report for Week', weekNum);

      await weeklyReport.save();
      console.log('✅ Weekly report saved successfully');

      // Notify supervisor about the submission
      try {
        await Notification.createSupervisorNotification(
          approvedApplication.supervisorId._id,
          'weekly_report_submitted',
          `Weekly Report Submitted - Week ${weekNum}`,
          `${req.user.name} has submitted their Week ${weekNum} report.`,
          `/dashboard/supervisor?tab=reports`,
          studentId
        );
        console.log('✅ Supervisor notification sent');
      } catch (notifError) {
        console.error('❌ Error sending supervisor notification:', notifError);
        // Don't fail the whole request if notification fails
      }

      console.log('✅ Simple weekly report submitted successfully');
      res.status(201).json({
        success: true,
        message: 'Weekly report submitted successfully',
        data: {
          report: weeklyReport,
          submissionId: weeklyReport._id
        }
      });

    } catch (error) {
      console.error('Error submitting simple weekly report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit weekly report',
        error: error.message
      });
    }
  },

  // Get available weekly report events for a student
  getAvailableEventsForStudent: async (req, res) => {
    try {
      const studentId = req.user.id;

      console.log('📅 Getting available events for student:', studentId);

      // Find student's approved application to get supervisor
      const approvedApplication = await Application.findOne({
        studentId: studentId,
        supervisorStatus: 'approved'
      }).populate('supervisorId', 'name email');

      if (!approvedApplication) {
        console.log('❌ No approved application found for student:', studentId);
        return res.json({
          success: true,
          data: {
            events: [],
            message: 'No approved internship application found. Please get your application approved first.'
          }
        });
      }

      const supervisorId = approvedApplication.supervisorId._id;
      console.log('👨‍🏫 Found supervisor for student:', supervisorId);

      // Get all active events from the student's supervisor
      const events = await WeeklyReportEvent.find({
        supervisorId: supervisorId,
        status: 'active',
        dueDate: { $gte: new Date() } // Only future/current events
      }).sort({ weekNumber: 1 });

      // Get student's already submitted reports to filter out completed weeks
      const submittedReports = await WeeklyReport.find({
        studentId: studentId,
        supervisorId: supervisorId
      }).select('weekEventId weekNumber');

      const submittedEventIds = submittedReports.map(report => report.weekEventId.toString());

      // Filter out events where student has already submitted
      const availableEvents = events.filter(event => 
        !submittedEventIds.includes(event._id.toString())
      );

      console.log('📊 Available events for student:', {
        totalEvents: events.length,
        submittedReports: submittedReports.length,
        availableEvents: availableEvents.length
      });

      res.json({
        success: true,
        data: {
          events: availableEvents,
          supervisorName: approvedApplication.supervisorId.name,
          totalEvents: events.length,
          submittedCount: submittedReports.length
        }
      });

    } catch (error) {
      console.error('❌ Error getting available events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available events',
        error: error.message
      });
    }
  },

  // Student submits a weekly report
  submitReport: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { 
        tasksCompleted, 
        reflections,
        additionalComments
      } = req.body;
      const studentId = req.user.id;
      const uploadedFiles = req.files || [];

      console.log('📝 Submit Weekly Report Request:', {
        eventId,
        studentId,
        body: req.body,
        filesCount: uploadedFiles.length
      });

      // Validate required fields
      if (!tasksCompleted || tasksCompleted.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Weekly Work Summary is required'
        });
      }

      if (!reflections || reflections.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Reflections field is required'
        });
      }

      // Find the event
      const event = await WeeklyReportEvent.findById(eventId);
      if (!event) {
        console.log('❌ Event not found:', eventId);
        return res.status(404).json({
          success: false,
          message: 'Weekly report event not found'
        });
      }

      console.log('📅 Found event:', event);

      // Check if event is still active and not expired
      if (event.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'This report event is no longer active'
        });
      }

      // Check if due date has passed
      if (new Date() > new Date(event.dueDate)) {
        return res.status(400).json({
          success: false,
          message: 'The due date for this report has passed'
        });
      }

      // Find student's approved application to get supervisor
      const approvedApplication = await Application.findOne({
        studentId: studentId,
        supervisorStatus: 'approved'
      }).populate('supervisorId', 'name email');

      if (!approvedApplication) {
        console.log('❌ No approved application found for student:', studentId);
        return res.status(404).json({
          success: false,
          message: 'No approved internship application found'
        });
      }

      // Verify that the event belongs to the student's supervisor
      if (event.supervisorId.toString() !== approvedApplication.supervisorId._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only submit reports for events created by your assigned supervisor'
        });
      }

      console.log('✅ Found approved application:', approvedApplication);

      // Check if student has already submitted for this event
      const existingSubmission = await WeeklyReport.findOne({
        weekEventId: eventId,
        studentId: studentId
      });

      if (existingSubmission) {
        return res.status(409).json({
          success: false,
          message: 'You have already submitted a report for this event'
        });
      }

      // Process uploaded files
      const supportingFiles = uploadedFiles.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/weekly-reports/${studentId}/${file.filename}`,
        uploadedAt: new Date()
      }));

      // Create the weekly report
      const weeklyReport = new WeeklyReport({
        studentId,
        studentName: req.user.name,
        studentRollNo: req.user.rollNumber || req.user.email,
        supervisorId: event.supervisorId,
        supervisorName: event.supervisorName,
        weekEventId: eventId,
        weekNumber: event.weekNumber,
        weekStartDate: event.weekStartDate || null,
        reportTitle: event.title,
        tasksCompleted: tasksCompleted.trim(),
        challengesFaced: '', // Not used in new form
        reflections: reflections.trim(),
        supportingMaterials: additionalComments?.trim() || '',
        supportingFiles: supportingFiles,
        plansForNextWeek: '', // Not used in new form
        companyName: approvedApplication.companyName || '',
        companyLocation: approvedApplication.companyLocation || '',
        status: 'submitted',
        submittedAt: new Date(),
        submissionMetadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          submissionMethod: 'web'
        }
      });

      console.log('💾 Creating weekly report with data:', {
        tasksCompleted: weeklyReport.tasksCompleted,
        reflections: weeklyReport.reflections,
        supportingFiles: supportingFiles.length,
        companyName: weeklyReport.companyName
      });

      await weeklyReport.save();
      console.log('✅ Weekly report saved successfully');

      // Notify supervisor about the submission
      try {
        await Notification.createSupervisorNotification(
          event.supervisorId,
          'weekly_report_submitted',
          `Weekly Report Submitted - Week ${event.weekNumber}`,
          `${req.user.name} has submitted their Week ${event.weekNumber} report.`,
          `/dashboard/supervisor?tab=reports`,
          studentId
        );
        console.log('✅ Supervisor notification sent');
      } catch (notifError) {
        console.error('❌ Error sending supervisor notification:', notifError);
        // Don't fail the whole request if notification fails
      }

      console.log('✅ Weekly report submitted successfully');
      res.status(201).json({
        success: true,
        message: 'Weekly report submitted successfully',
        data: {
          report: weeklyReport,
          submissionId: weeklyReport._id
        }
      });

    } catch (error) {
      console.error('Error submitting weekly report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit weekly report',
        error: error.message
      });
    }
  },

  // Get weekly reports for supervisor review
  getSupervisorReports: async (req, res) => {
    try {
      const supervisorId = req.user.id;
      const { weekNumber, status, page = 1, limit = 10, search } = req.query;

      // Build query
      const query = { supervisorId };
      
      if (weekNumber) {
        query.weekNumber = parseInt(weekNumber);
      }
      
      if (status) {
        query.status = status;
      }

      // Add search functionality
      if (search) {
        query.$or = [
          { studentName: { $regex: search, $options: 'i' } },
          { studentRollNo: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } }
        ];
      }

      const reports = await WeeklyReport.find(query)
        .populate('studentId', 'name email rollNumber')
        .populate('weekEventId', 'title instructions dueDate weekStartDate')
        .sort({ weekNumber: -1, submittedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await WeeklyReport.countDocuments(query);

      // Group reports by week number for better organization
      const reportsByWeek = {};
      reports.forEach(report => {
        const week = report.weekNumber;
        if (!reportsByWeek[week]) {
          reportsByWeek[week] = [];
        }
        reportsByWeek[week].push(report);
      });

      res.json({
        success: true,
        data: {
          reports,
          reportsByWeek,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: reports.length,
            totalRecords: total
          }
        }
      });

    } catch (error) {
      console.error('Error fetching supervisor reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weekly reports',
        error: error.message
      });
    }
  },

  // Get specific report details
  getReportDetails: async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const report = await WeeklyReport.findById(reportId)
        .populate('studentId', 'name email rollNumber')
        .populate('supervisorId', 'name email')
        .populate('weekEventId', 'title instructions dueDate');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Weekly report not found'
        });
      }

      // Check authorization
      const isAuthorized = 
        (userRole === 'student' && report.studentId._id.toString() === userId) ||
        (userRole === 'supervisor' && report.supervisorId._id.toString() === userId) ||
        userRole === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this report'
        });
      }

      res.json({
        success: true,
        data: { report }
      });

    } catch (error) {
      console.error('Error fetching report details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report details',
        error: error.message
      });
    }
  },

  // Supervisor reviews and provides feedback on a report
  reviewReport: async (req, res) => {
    try {
      const { reportId } = req.params;
      const { feedback, rating } = req.body;
      const supervisorId = req.user.id;
      const supervisorName = req.user.name;

      const report = await WeeklyReport.findById(reportId)
        .populate('studentId', 'name email');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Weekly report not found'
        });
      }

      // Verify supervisor authorization
      if (report.supervisorId.toString() !== supervisorId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to review this report'
        });
      }

      // Update report with feedback
      report.supervisorFeedback = {
        feedback: feedback || '',
        rating: rating ? parseInt(rating) : null,
        reviewedAt: new Date(),
        reviewedBy: supervisorName
      };
      report.status = 'reviewed';

      await report.save();

      // Notify student about the review
      await Notification.createStudentNotification(
        report.studentId._id,
        'weekly_report_reviewed',
        `Weekly Report Reviewed - Week ${report.weekNumber}`,
        `Your supervisor has reviewed your Week ${report.weekNumber} report.`,
        `/dashboard/student?tab=reports`,
        supervisorId
      );

      res.json({
        success: true,
        message: 'Report reviewed successfully',
        data: { report }
      });

    } catch (error) {
      console.error('Error reviewing report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to review report',
        error: error.message
      });
    }
  },

  // Generate PDF for weekly report
  generateReportPDF: async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log('📄 Generating PDF for report:', reportId);

      // Find the report
      const report = await WeeklyReport.findById(reportId)
        .populate('studentId', 'name email')
        .populate('supervisorId', 'name email')
        .populate('weekEventId', 'title instructions');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Weekly report not found'
        });
      }

      // Check authorization - students can only view their own reports, supervisors can view their students' reports
      if (userRole === 'student' && report.studentId._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this report'
        });
      }

      if (userRole === 'supervisor' && report.supervisorId._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this report'
        });
      }

      const { UniversalPDFTemplate } = require('../utils/pdfTemplate');
      const template = new UniversalPDFTemplate();

      // Set response headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="weekly_report_week_${report.weekNumber}_${report.studentName.replace(/\s+/g, '_')}.pdf"`);

      // Pipe the PDF to response
      template.getDocument().pipe(res);

      // Build PDF content using the same structure as misconduct reports
      console.log('📊 Report data for PDF:', {
        tasksCompleted: report.tasksCompleted,
        challengesFaced: report.challengesFaced,
        reflections: report.reflections,
        plansForNextWeek: report.plansForNextWeek,
        supportingMaterials: report.supportingMaterials
      });

      template
        .addHeader()
        .addTitle(`Weekly Report - Week ${report.weekNumber}`)
        .addDetailsSection({
          'Student Name': `${report.studentName} (${report.studentRollNo || 'N/A'})`,
          'Supervisor': report.supervisorName,
          'Company': report.companyName || 'Not specified',
          'Company Location': report.companyLocation || 'Not specified',
          'Week Number': `Week ${report.weekNumber}`,
          'Report Title': report.reportTitle,
          'Due Date': new Date(report.dueDate).toLocaleDateString(),
          'Submitted Date': new Date(report.submittedAt).toLocaleDateString(),
          'Status': report.status.charAt(0).toUpperCase() + report.status.slice(1)
        })
        .addContentSection('Tasks Completed', report.tasksCompleted)
        .addContentSection('Challenges Faced', report.challengesFaced)
        .addContentSection('Key Learnings', report.reflections)
        .addContentSection('Plans for Next Week', report.plansForNextWeek)
        .addContentSection('Additional Comments', report.supportingMaterials);

      // Add supervisor feedback if available
      if (report.supervisorFeedback && report.supervisorFeedback.feedback) {
        template.addContentSection('Supervisor Feedback', report.supervisorFeedback.feedback);
        
        const feedbackDetails = {};
        if (report.supervisorFeedback.rating) {
          feedbackDetails['Rating'] = `${report.supervisorFeedback.rating}/5 stars`;
        }
        if (report.supervisorFeedback.reviewedAt) {
          feedbackDetails['Reviewed Date'] = new Date(report.supervisorFeedback.reviewedAt).toLocaleDateString();
        }
        if (report.supervisorFeedback.reviewedBy) {
          feedbackDetails['Reviewed By'] = report.supervisorFeedback.reviewedBy;
        }
        
        if (Object.keys(feedbackDetails).length > 0) {
          template.addDetailsSection(feedbackDetails);
        }
      }

      template.finalize();

      console.log('✅ PDF generated successfully');

    } catch (error) {
      console.error('Error generating weekly report PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  },

  // Rest of the controller methods...
  getReportStatistics: async (req, res) => {
    try {
      const supervisorId = req.user.id;

      // Get total events created
      const totalEvents = await WeeklyReportEvent.countDocuments({ supervisorId });

      // Get total submissions
      const totalSubmissions = await WeeklyReport.countDocuments({ supervisorId });

      // Get pending reviews
      const pendingReviews = await WeeklyReport.countDocuments({
        supervisorId,
        status: 'submitted'
      });

      // Get reviewed reports
      const reviewedReports = await WeeklyReport.countDocuments({
        supervisorId,
        status: 'reviewed'
      });

      // Get overdue submissions
      const currentDate = new Date();
      const overdueEvents = await WeeklyReportEvent.find({
        supervisorId,
        status: 'active',
        dueDate: { $lt: currentDate }
      });

      let overdueSubmissions = 0;
      for (const event of overdueEvents) {
        const submissionCount = await WeeklyReport.countDocuments({
          weekEventId: event._id
        });
        if (submissionCount === 0) {
          overdueSubmissions++;
        }
      }

      // Get submission trends (last 6 weeks)
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

      const recentSubmissions = await WeeklyReport.aggregate([
        {
          $match: {
            supervisorId: require('mongoose').Types.ObjectId(supervisorId),
            submittedAt: { $gte: sixWeeksAgo }
          }
        },
        {
          $group: {
            _id: {
              week: { $week: "$submittedAt" },
              year: { $year: "$submittedAt" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { "_id.year": 1, "_id.week": 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            totalEvents,
            totalSubmissions,
            pendingReviews,
            reviewedReports,
            overdueSubmissions
          },
          trends: recentSubmissions
        }
      });

    } catch (error) {
      console.error('Error fetching report statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report statistics',
        error: error.message
      });
    }
  },

  // Update event status (close/reopen events)
  updateEventStatus: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { status } = req.body;
      const supervisorId = req.user.id;

      if (!['active', 'completed', 'expired'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be active, completed, or expired'
        });
      }

      const event = await WeeklyReportEvent.findOne({
        _id: eventId,
        supervisorId
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or you do not have permission to modify it'
        });
      }

      event.status = status;
      await event.save();

      res.json({
        success: true,
        message: `Event status updated to ${status}`,
        data: { event }
      });

    } catch (error) {
      console.error('Error updating event status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update event status',
        error: error.message
      });
    }
  },

  // Debug endpoint to check weekly report data
  debugReportData: async (req, res) => {
    try {
      const { reportId } = req.params;
      
      const report = await WeeklyReport.findById(reportId);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }
      
      res.json({
        success: true,
        debug: {
          id: report._id,
          studentName: report.studentName,
          weekNumber: report.weekNumber,
          tasksCompleted: report.tasksCompleted,
          tasksCompletedLength: report.tasksCompleted?.length || 0,
          challengesFaced: report.challengesFaced,
          challengesFacedLength: report.challengesFaced?.length || 0,
          reflections: report.reflections,
          reflectionsLength: report.reflections?.length || 0,
          plansForNextWeek: report.plansForNextWeek,
          plansForNextWeekLength: report.plansForNextWeek?.length || 0,
          supportingMaterials: report.supportingMaterials,
          supportingMaterialsLength: report.supportingMaterials?.length || 0,
          status: report.status,
          createdAt: report.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get student's submitted weekly reports
  getStudentReports: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const reports = await WeeklyReport.find({ studentId })
        .populate('supervisorId', 'name email')
        .sort({ weekNumber: -1, submittedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await WeeklyReport.countDocuments({ studentId });

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: reports.length,
            totalRecords: total
          }
        }
      });

    } catch (error) {
      console.error('Error fetching student reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch weekly reports',
        error: error.message
      });
    }
  },

  // Get weekly reports submitted by students under this supervisor
  getSupervisorStudentReports: async (req, res) => {
    try {
      const supervisorId = req.user.id;
      const { page = 1, limit = 10, status, weekNumber, search } = req.query;

      const query = { supervisorId };
      
      if (status) {
        query.status = status;
      }
      
      if (weekNumber) {
        query.weekNumber = parseInt(weekNumber);
      }
      
      if (search) {
        query.$or = [
          { studentName: { $regex: search, $options: 'i' } },
          { tasksCompleted: { $regex: search, $options: 'i' } },
          { challengesFaced: { $regex: search, $options: 'i' } }
        ];
      }

      const reports = await WeeklyReport.find(query)
        .populate('studentId', 'name email rollNumber')
        .sort({ submittedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await WeeklyReport.countDocuments(query);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(total / limit),
            count: reports.length,
            totalRecords: total
          }
        }
      });

    } catch (error) {
      console.error('Error fetching supervisor student reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student weekly reports',
        error: error.message
      });
    }
  },

  // Generate and download weekly report PDF
  downloadReportPDF: async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = req.user.id;

      console.log('📄 PDF Download Request:', { reportId, userId });

      // Find the report
      const report = await WeeklyReport.findById(reportId)
        .populate('studentId', 'name email')
        .populate('weekEventId', 'title instructions dueDate');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Weekly report not found'
        });
      }

      // Fetch student details from Student model to get rollNumber
      const studentDetails = await Student.findOne({ 
        userId: report.studentId._id 
      }).select('rollNumber phoneNumber');

      // Fetch student's application to get company details
      const studentApplication = await Application.findOne({
        studentId: report.studentId._id,
        applicationStatus: 'hired'
      }).populate('companyId', 'name location').populate('jobId', 'jobTitle');

      // Check authorization - student can download their own reports, supervisors can download their students' reports
      const isStudent = report.studentId._id.toString() === userId;
      const isSupervisor = report.supervisorId.toString() === userId;

      if (!isStudent && !isSupervisor) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to download this report'
        });
      }

      console.log('✅ Authorization passed for PDF download');

      console.log('📋 Student application found:', studentApplication ? 'Yes' : 'No');
      console.log('📋 Student details found:', studentDetails ? 'Yes' : 'No');

      // Generate PDF filename for download
      const sanitizedStudentName = report.studentId.name.replace(/[^a-zA-Z0-9]/g, '_');
      const pdfFilename = `Weekly_Report_Week${report.weekNumber}_${sanitizedStudentName}_${Date.now()}.pdf`;

      console.log('📁 Generating PDF:', pdfFilename);

      // Prepare report data for PDF generation
      const reportData = {
        student: {
          name: report.studentId.name,
          rollNo: studentDetails?.rollNumber || 'N/A'
        },
        company: {
          name: report.companyName || (studentApplication?.companyId?.name) || 'N/A',
          supervisor: report.supervisorName || 'N/A',
          department: studentApplication?.studentProfile?.department || 'N/A'
        },
        internship: {
          title: studentApplication?.jobId?.jobTitle || 'Internship Position'
        },
        weekNumber: report.weekNumber,
        tasksCompleted: report.tasksCompleted,
        reflections: report.reflections,
        supportingMaterials: report.supportingMaterials,
        supportingFiles: report.supportingFiles || [],
        status: report.status,
        // Legacy field support
        studentName: report.studentId.name,
        studentRollNo: studentDetails?.rollNumber || 'N/A',
        supervisorName: report.supervisorName || 'N/A',
        companyName: report.companyName || (studentApplication?.companyId?.name) || 'N/A',
        department: studentApplication?.studentProfile?.department || 'N/A',
        position: studentApplication?.jobId?.jobTitle || 'Internship Position'
      };

      // Generate professional A4 PDF with COMSATS styling
      const pdfGenerator = new COMSATSWeeklyReportPDFGenerator(
        `COMSATS Weekly Report - Week ${report.weekNumber} - ${report.studentId.name}`
      );
      
      // Set response headers for proper PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
      
      // Stream PDF directly to response
      pdfGenerator.getDocument().pipe(res);
      
      // Build professional A4 PDF content with COMSATS styling
      const infoData = [
        ['Student Name', report.studentId.name || 'N/A'],
        ['Roll Number', studentDetails?.rollNumber || 'N/A'],
        ['Student Email', report.studentId.email || 'N/A'],
        ['Company/Organization', report.companyName || (studentApplication?.companyId?.name) || 'N/A'],
        ['Supervisor', report.supervisorName || 'N/A'],
        ['Week Number', `Week ${report.weekNumber || 'N/A'}`],
        ['Department', studentApplication?.studentProfile?.department || 'N/A'],
        ['Position', studentApplication?.jobId?.jobTitle || 'Internship Position'],
        ['Report Status', (report.status || 'Submitted').toUpperCase()],
        ['Submission Date', report.submittedAt ? new Date(report.submittedAt).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }) : 'N/A']
      ];
      
      // Generate professional A4 PDF with Times New Roman fonts
      pdfGenerator
        .addHeader()
        .addTitle(`WEEKLY REPORT - WEEK ${report.weekNumber || 'N/A'}`)
        .addSectionHeading('STUDENT & INTERNSHIP DETAILS')
        .addInfoTable(infoData);
      
      // Add content sections based on actual form fields
      if (report.tasksCompleted && report.tasksCompleted.trim()) {
        pdfGenerator.addContentSection('WEEKLY WORK SUMMARY', report.tasksCompleted.trim());
      }
      
      if (report.reflections && report.reflections.trim()) {
        pdfGenerator.addContentSection('REFLECTIONS - WHAT DID YOU LEARN THIS WEEK?', report.reflections.trim());
      }
      
      if (report.supportingMaterials && report.supportingMaterials.trim()) {
        pdfGenerator.addContentSection('ADDITIONAL COMMENTS', report.supportingMaterials.trim());
      }
      
      // Add supporting files section if files are attached
      if (report.supportingFiles && report.supportingFiles.length > 0) {
        const filesInfo = report.supportingFiles.map((file, index) => 
          `${index + 1}. ${file.originalname || file.filename} (${file.mimetype || 'Unknown type'})`
        ).join('\n');
        pdfGenerator.addContentSection('SUPPORTING FILES', filesInfo);
      }
      
      // Add signature section for report validation (no acknowledgment as it's not in the form)
      pdfGenerator
        .addSignatureSection()
        .addFooter()
        .finalize();
      
      console.log('✅ Professional A4 Weekly Report PDF generated and streamed successfully');

    } catch (error) {
      console.error('❌ Error generating weekly report PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  },

  // Add supervisor feedback to a weekly report
  addSupervisorFeedback: async (req, res) => {
    try {
      const { reportId } = req.params;
      const { feedback, status } = req.body;
      const supervisorId = req.user.id;

      console.log('💬 Supervisor Feedback Request:', {
        reportId,
        supervisorId,
        feedback: feedback?.substring(0, 100) + '...',
        status
      });

      // Validate inputs
      if (!feedback || feedback.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Feedback is required'
        });
      }

      if (status && !['reviewed', 'approved', 'needs_revision'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: reviewed, approved, or needs_revision'
        });
      }

      // Find the report
      const report = await WeeklyReport.findById(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Weekly report not found'
        });
      }

      // Verify supervisor authorization
      if (report.supervisorId.toString() !== supervisorId) {
        return res.status(403).json({
          success: false,
          message: 'You can only provide feedback for your students\' reports'
        });
      }

      // Update the report with feedback
      report.supervisorFeedback = feedback.trim();
      report.feedbackDate = new Date();
      
      if (status) {
        report.status = status;
      }

      await report.save();

      console.log('✅ Supervisor feedback added successfully');

      // Notify student about the feedback
      try {
        await Notification.createStudentNotification(
          report.studentId,
          'weekly_report_feedback',
          `Feedback Received - Week ${report.weekNumber}`,
          `Your supervisor has provided feedback on your Week ${report.weekNumber} report.`,
          `/dashboard/student?tab=reports`,
          supervisorId
        );
        console.log('✅ Student notification sent for feedback');
      } catch (notifError) {
        console.error('❌ Error sending student notification:', notifError);
        // Don't fail the request if notification fails
      }

      res.json({
        success: true,
        message: 'Feedback added successfully',
        data: {
          reportId: report._id,
          feedback: report.supervisorFeedback,
          status: report.status,
          feedbackDate: report.feedbackDate
        }
      });

    } catch (error) {
      console.error('❌ Error adding supervisor feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add feedback',
        error: error.message
      });
    }
  },

  // Download supporting file
  downloadSupportingFile: async (req, res) => {
    try {
      const { reportId, fileIndex } = req.params;
      const userId = req.user.id;

      console.log(`📥 Download supporting file - Report: ${reportId}, File Index: ${fileIndex}, User: ${userId}`);

      // Find the report
      const report = await WeeklyReport.findById(reportId);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Weekly report not found'
        });
      }

      // Verify user has access (student who submitted, supervisor, or admin)
      const isStudent = report.studentId.toString() === userId;
      const isSupervisor = report.supervisorId.toString() === userId;
      const isAdmin = req.user.role === 'admin';

      if (!isStudent && !isSupervisor && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this file'
        });
      }

      // Get the file
      const fileIdx = parseInt(fileIndex);
      if (isNaN(fileIdx) || fileIdx < 0 || fileIdx >= report.supportingFiles.length) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      const file = report.supportingFiles[fileIdx];
      const path = require('path');
      const fs = require('fs');
      
      console.log('📂 File data from DB:', {
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        mimetype: file.mimetype
      });
      
      // Construct the full file path - handle both relative and absolute paths
      let filePath;
      if (path.isAbsolute(file.path)) {
        filePath = file.path;
      } else {
        // Try relative to project root first
        filePath = path.join(__dirname, '..', file.path);
        
        // If not found, try removing leading slash and join with uploads folder
        if (!fs.existsSync(filePath)) {
          const relativePath = file.path.replace(/^\//, ''); // Remove leading slash
          filePath = path.join(__dirname, '..', relativePath);
        }
        
        // If still not found, try with uploads directory
        if (!fs.existsSync(filePath)) {
          filePath = path.join(__dirname, '..', 'uploads', 'weekly-reports', report.studentId.toString(), file.filename);
        }
      }

      console.log('📍 Checking file path:', filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('❌ File not found on disk');
        console.error('❌ Tried path:', filePath);
        console.error('❌ File from DB:', file);
        return res.status(404).json({
          success: false,
          message: 'File not found on server',
          debug: {
            attemptedPath: filePath,
            storedPath: file.path,
            filename: file.filename
          }
        });
      }

      console.log('✅ File found, sending:', file.originalname);

      // Set headers for download
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalname)}"`);

      // Send the file
      res.sendFile(filePath);

    } catch (error) {
      console.error('❌ Error downloading supporting file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download file',
        error: error.message
      });
    }
  }
};

module.exports = weeklyReportController;
