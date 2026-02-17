const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Student = require('../models/Student');
const { getFileUrl } = require('../middleware/upload');
const { createApplicationNotification } = require('./notificationController');
const emailService = require('../services/emailService');
const { isSupervisorAtCapacity } = require('../utils/supervisorUtils');
const path = require('path');
const fs = require('fs');

// Helper function to add file URLs to application data
const addFileUrlsToApplication = (req, application) => {
  const appData = application.toObject ? application.toObject() : application;
  
  if (appData.studentProfile) {
    // Add CV URL
    if (appData.studentProfile.cv && appData.studentProfile.cv.path) {
      appData.studentProfile.cv.url = getFileUrl(req, appData.studentProfile.cv.path);
    }
    
    // Add certificate URLs
    if (appData.studentProfile.certificates && appData.studentProfile.certificates.length > 0) {
      appData.studentProfile.certificates = appData.studentProfile.certificates.map(cert => ({
        ...cert,
        url: getFileUrl(req, cert.path)
      }));
    }
  }
  
  return appData;
};

// @desc    Submit application for internship
// @route   POST /api/applications
// @access  Private (Student only)
const submitApplication = async (req, res) => {
  try {
    const { jobId, supervisorId, coverLetter } = req.body;
    const studentId = req.user.id;

    console.log('=== APPLICATION SUBMISSION ===');
    console.log('Student ID:', studentId);
    console.log('Job ID:', jobId);
    console.log('Supervisor ID:', supervisorId);

    // Validate required fields
    if (!jobId || !supervisorId || !coverLetter) {
      return res.status(400).json({
        success: false,
        message: 'Job ID, supervisor ID, and cover letter are required'
      });
    }

    // Check if student has ANY active (non-rejected) application
    const anyActiveApplication = await Application.findOne({
      studentId,
      applicationStatus: { $nin: ['rejected', 'rejected_by_supervisor', 'rejected_by_company'] }
    });

    if (anyActiveApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active job application. Please wait for a response before applying to another job.'
      });
    }

    // Check if student already applied for this specific job
    const existingApplication = await Application.findOne({
      studentId,
      jobId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job is still active
    if (job.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }

    // Check if HIRED student limit has been reached (not pending applications)
    const hiredCount = await Application.countDocuments({
      jobId: jobId,
      applicationStatus: 'hired'
    });

    if (hiredCount >= job.applicationLimit) {
      return res.status(400).json({
        success: false,
        message: 'This job has reached its maximum number of hired students and is no longer accepting applications.'
      });
    }

    // Get student details from Student model (more comprehensive)
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get detailed student profile from Student model
    const studentProfile = await Student.findOne({ email: student.email });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Validate supervisor exists (but don't check capacity for job applications)
    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    console.log(`✅ Job application supervisor validation passed for: ${supervisor.name}`);

    // Update student's selected supervisor for this job application
    await Student.findOneAndUpdate(
      { email: student.email },
      { selectedSupervisorId: supervisorId },
      { new: true }
    );

    // Create application
    const application = new Application({
      studentId,
      studentName: student.name,
      studentEmail: student.email,
      studentProfile: {
        rollNumber: studentProfile.rollNumber,
        department: studentProfile.department,
        semester: studentProfile.semester,
        cgpa: studentProfile.cgpa,
        phoneNumber: studentProfile.phoneNumber,
        attendance: studentProfile.attendance,
        backlogs: studentProfile.backlogs,
        cv: studentProfile.cv || {
          filename: null,
          originalName: null,
          path: null,
          size: null,
          uploadedAt: null
        },
        certificates: studentProfile.certificates || []
      },
      jobId,
      jobTitle: job.jobTitle,
      companyId: job.companyId,
      companyName: job.companyName,
      supervisorId,
      supervisorName: supervisor.name,
      coverLetter
    });

    await application.save();

    console.log('Application created successfully:', application._id);
    console.log('Note: Job applicationsCount will be updated only when student is hired');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting application',
      error: error.message
    });
  }
};

// @desc    Get applications for supervisor review
// @route   GET /api/applications/supervisor/pending
// @access  Private (Supervisor only)
const getSupervisorApplications = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    // Get all applications for students supervised by this supervisor
    const applications = await Application.find({
      supervisorId
    })
    .populate('studentId', 'name email')
    .populate('jobId', 'jobTitle companyName location jobDescription salary')
    .populate('companyId', 'name email')
    .sort({ appliedAt: -1 });

    // Add file URLs to each application
    const applicationsWithUrls = applications.map(app => addFileUrlsToApplication(req, app));

    res.status(200).json({
      success: true,
      data: applicationsWithUrls
    });

  } catch (error) {
    console.error('Error fetching supervisor applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications',
      error: error.message
    });
  }
};

// @desc    Get pending applications for supervisor review
// @route   GET /api/applications/supervisor/pending
// @access  Private (Supervisor only)
const getSupervisorPendingApplications = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const applications = await Application.find({
      supervisorId,
      supervisorStatus: 'pending'
    })
    .populate('studentId', 'name email')
    .populate('jobId', 'jobTitle companyName location jobDescription')
    .sort({ appliedAt: -1 });

    // Add file URLs to each application
    const applicationsWithUrls = applications.map(app => addFileUrlsToApplication(req, app));

    res.status(200).json({
      success: true,
      data: applicationsWithUrls
    });

  } catch (error) {
    console.error('Error fetching supervisor pending applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending applications',
      error: error.message
    });
  }
};

// @desc    Supervisor approve/reject application
// @route   PUT /api/applications/:id/supervisor-review
// @access  Private (Supervisor only)
const supervisorReviewApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const supervisorId = req.user.id;

    console.log('=== SUPERVISOR REVIEW ===');
    console.log('Application ID:', id);
    console.log('Status:', status);
    console.log('Supervisor ID:', supervisorId);

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const application = await Application.findOne({
      _id: id,
      supervisorId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application
    application.supervisorStatus = status;
    application.supervisorComments = comments || '';
    application.supervisorReviewedAt = new Date();
    
    if (status === 'approved') {
      application.overallStatus = 'supervisor_approved';
    } else {
      application.overallStatus = 'rejected';
    }

    await application.save();

    console.log('Application updated successfully');

    // Send email notification for supervisor approval
    if (status === 'approved') {
      try {
        console.log('📧 Sending job application approved email...');
        
        // Get populated data for email
        const populatedApplication = await Application.findById(application._id)
          .populate('studentId', 'name email')
          .populate('jobId', 'title company description location requirements')
          .populate('supervisorId', 'name email')
          .populate('companyId', 'name email');

        const student = populatedApplication.studentId;
        const job = populatedApplication.jobId;
        const company = populatedApplication.companyId;

        await emailService.sendJobApprovedEmail(student, populatedApplication, job, company);
        console.log('✅ Job application approved email sent successfully');
        
      } catch (emailError) {
        console.error('❌ Error sending job approval email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Create notification for the student
    try {
      // Get application with populated data for notification
      const populatedApplication = await Application.findById(application._id)
        .populate('studentId', 'email')
        .populate('jobId', 'jobTitle companyName')
        .populate('supervisorId', 'name');

      if (populatedApplication && populatedApplication.studentId && populatedApplication.jobId) {
        // Find the student's user account
        const studentUser = await User.findOne({ email: populatedApplication.studentId.email });
        
        if (studentUser) {
          await createApplicationNotification(
            studentUser._id,
            application._id,
            status,
            populatedApplication.supervisorId?.name || 'Your Supervisor',
            populatedApplication.jobId.jobTitle,
            populatedApplication.jobId.companyName,
            comments
          );
          
          console.log(`📧 Application notification sent to student for ${status} status`);
        }
      }
    } catch (notificationError) {
      console.error('Error creating application notification:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: application
    });

  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing application',
      error: error.message
    });
  }
};

// @desc    Supervisor reject application with feedback
// @route   PATCH /api/applications/:id/supervisor/reject
// @access  Private (Supervisor only)
const supervisorRejectWithFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, details, requestedFixes = [], fieldsToEdit = [] } = req.body;
    const supervisorId = req.user.id;

    console.log('=== SUPERVISOR REJECT WITH FEEDBACK ===');
    console.log('Application ID:', id);
    console.log('Supervisor ID:', supervisorId);

    if (!reason || !details) {
      return res.status(400).json({
        success: false,
        message: 'Reason and details are required for rejection'
      });
    }

    const application = await Application.findOne({
      _id: id,
      supervisorId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application
    application.supervisorStatus = 'rejected';
    application.overallStatus = 'supervisor_changes_requested';
    application.supervisorReviewedAt = new Date();
    
    // Set rejection feedback
    application.rejectionFeedback = {
      reason,
      details,
      requestedFixes,
      fieldsToEdit,
      bySupervisorId: supervisorId,
      at: new Date()
    };

    // Add initial revision if not exists
    if (application.revisions.length === 0) {
      application.revisions.push({
        type: 'initial',
        payload: {
          coverLetter: application.coverLetter
        },
        note: 'Initial submission',
        at: application.appliedAt
      });
    }

    await application.save();

    console.log('Application rejected with feedback successfully');

    res.status(200).json({
      success: true,
      message: 'Application rejected with feedback',
      data: application
    });

  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting application',
      error: error.message
    });
  }
};

// @desc    Student resubmit application after fixes
// @route   PATCH /api/applications/:id/resubmit
// @access  Private (Student only)
const studentResubmitApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverLetter, answers, cvUrl, certificates, note = '' } = req.body;
    const studentId = req.user.id;

    console.log('=== STUDENT RESUBMIT APPLICATION ===');
    console.log('Application ID:', id);
    console.log('Student ID:', studentId);

    const application = await Application.findOne({
      _id: id,
      studentId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.overallStatus !== 'supervisor_changes_requested') {
      return res.status(409).json({
        success: false,
        message: 'Application is not in a state that allows resubmission'
      });
    }

    // Get updated student profile from Student model
    const student = await User.findById(studentId);
    const studentProfile = await Student.findOne({ email: student.email });
    
    if (studentProfile) {
      // Update student profile information in the application
      application.studentProfile = {
        rollNumber: studentProfile.rollNumber,
        department: studentProfile.department,
        semester: studentProfile.semester,
        cgpa: studentProfile.cgpa,
        phoneNumber: studentProfile.phoneNumber,
        attendance: studentProfile.attendance,
        backlogs: studentProfile.backlogs,
        cv: studentProfile.cv || {
          filename: null,
          originalName: null,
          path: null,
          size: null,
          uploadedAt: null
        },
        certificates: studentProfile.certificates || []
      };
    }

    // Update only provided fields
    const payload = {
      studentProfileUpdated: true, // Flag to indicate profile was refreshed
      updatedAt: new Date()
    };
    if (coverLetter !== undefined) {
      application.coverLetter = coverLetter;
      payload.coverLetter = coverLetter;
    }
    if (answers !== undefined) {
      application.answers = answers;
      payload.answers = answers;
    }
    if (cvUrl !== undefined) {
      application.cvUrl = cvUrl;
      payload.cvUrl = cvUrl;
    }
    if (certificates !== undefined) {
      application.certificates = certificates;
      payload.certificates = certificates;
    }

    // Update status
    application.overallStatus = 'resubmitted_to_supervisor';
    application.supervisorStatus = 'pending';
    
    // Clear rejection feedback (keep as history but mark as resolved)
    application.rejectionFeedback = null;

    // Add revision
    application.revisions.push({
      type: 'resubmission',
      payload,
      note,
      at: new Date()
    });

    await application.save();

    console.log('Application resubmitted successfully');

    res.status(200).json({
      success: true,
      message: 'Application resubmitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Error resubmitting application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resubmitting application',
      error: error.message
    });
  }
};

// @desc    Supervisor approve application after resubmission
// @route   PATCH /api/applications/:id/supervisor/approve
// @access  Private (Supervisor only)
const supervisorApproveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const supervisorId = req.user.id;

    console.log('=== SUPERVISOR APPROVE APPLICATION ===');
    console.log('Application ID:', id);
    console.log('Supervisor ID:', supervisorId);

    const application = await Application.findOne({
      _id: id,
      supervisorId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application
    application.supervisorStatus = 'approved';
    application.overallStatus = 'supervisor_approved';
    application.supervisorReviewedAt = new Date();

    await application.save();

    // Increment supervisor's current student count and add to assigned students
    await User.findByIdAndUpdate(supervisorId, {
      $inc: { 'supervisor.currentStudents': 1 },
      $addToSet: { 'supervisor.assignedStudents': application.studentId }
    });

    console.log('✅ Application approved successfully and supervisor student count updated');

    console.log('Application approved successfully');

    // Send email notification for supervisor approval
    try {
      console.log('📧 Sending job application approved email...');
      
      // Get populated data for email
      const populatedApplication = await Application.findById(application._id)
        .populate('studentId', 'name email')
        .populate('jobId', 'title company description location requirements')
        .populate('supervisorId', 'name email')
        .populate('companyId', 'name email');

      const student = populatedApplication.studentId;
      const job = populatedApplication.jobId;
      const company = populatedApplication.companyId;

      await emailService.sendJobApprovedEmail(student, populatedApplication, job, company);
      console.log('✅ Job application approved email sent successfully');
      
    } catch (emailError) {
      console.error('❌ Error sending job approval email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Application approved successfully',
      data: application
    });

  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving application',
      error: error.message
    });
  }
};

// @desc    Get applications for company review (supervisor approved)
// @route   GET /api/applications/company/pending
// @access  Private (Company only)
const getCompanyApplications = async (req, res) => {
  try {
    const companyId = req.user.id;

    // Get ALL applications for the company (not just pending ones)
    // This includes pending, hired, rejected, etc.
    const applications = await Application.find({
      companyId,
      supervisorStatus: 'approved' // Only show supervisor-approved applications
    })
    .populate('studentId', 'name email')
    .populate('jobId', 'title description')
    .sort({ updatedAt: -1 }); // Sort by most recently updated

    console.log(`=== ALL COMPANY APPLICATIONS ===`);
    console.log(`Found ${applications.length} applications for company ${companyId}`);
    
    // Log application statuses for debugging
    const statusCounts = {};
    applications.forEach(app => {
      const status = app.applicationStatus || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('Application status breakdown:', statusCounts);

    // Add file URLs to each application
    const applicationsWithUrls = applications.map(app => addFileUrlsToApplication(req, app));

    res.status(200).json({
      success: true,
      data: applicationsWithUrls
    });

  } catch (error) {
    console.error('Error fetching company applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications',
      error: error.message
    });
  }
};

// @desc    Company approve/reject application
// @route   PUT /api/applications/:id/company-review
// @access  Private (Company only)
const companyReviewApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const companyId = req.user.id;

    console.log('=== COMPANY REVIEW ===');
    console.log('Application ID:', id);
    console.log('Status:', status);
    console.log('Company ID:', companyId);

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const application = await Application.findOne({
      _id: id,
      companyId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application
    application.companyStatus = status;
    application.companyComments = comments || '';
    application.companyReviewedAt = new Date();
    application.overallStatus = status === 'approved' ? 'approved' : 'rejected';

    await application.save();

    console.log('Application reviewed by company successfully');

    // Send email notifications based on company review status
    if (status === 'approved') {
      try {
        console.log('📧 Sending hiring success email (company approved)...');
        
        // Get populated data for email
        const populatedApplication = await Application.findById(application._id)
          .populate('studentId', 'name email')
          .populate('jobId', 'title company description location requirements duration stipend salary')
          .populate('supervisorId', 'name email')
          .populate('companyId', 'name email location address');

        const studentUser = populatedApplication.studentId;
        const job = populatedApplication.jobId;
        const company = populatedApplication.companyId;

        // Get complete student profile data
        const studentProfile = await Student.findOne({ email: studentUser.email });
        
        // Combine student user data with profile data
        const student = {
          name: studentUser.name,
          email: studentUser.email,
          rollNo: studentProfile?.rollNo || 'N/A',
          department: studentProfile?.department || 'Computer Science',
          studentProfile: studentProfile
        };

        // Create offer object with details
        const offer = {
          _id: populatedApplication._id,
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default start date 1 week from now
          duration: job.duration || '3 months',
          stipend: job.stipend || job.salary || 'As per company policy',
          location: job.location || company.location,
          reportingManager: 'HR Team',
          hrContact: company.email
        };

        // Create interview object for the email
        const interview = {
          applicationId: populatedApplication._id,
          scheduledAt: populatedApplication.interviewDetails?.date || new Date()
        };

        await emailService.sendInterviewSuccessEmail(student, interview, job, company, offer);
        console.log('✅ Hiring success email sent successfully (company approved)');
        
      } catch (emailError) {
        console.error('❌ Error sending company approval email:', emailError);
        // Don't fail the request if email fails
      }
    } else if (status === 'rejected') {
      try {
        console.log('📧 Sending interview rejection email (company rejected)...');
        
        // Get populated data for email
        const populatedApplication = await Application.findById(application._id)
          .populate('studentId', 'name email')
          .populate('jobId', 'title company description location requirements')
          .populate('supervisorId', 'name email')
          .populate('companyId', 'name email');

        const student = populatedApplication.studentId;
        const job = populatedApplication.jobId;
        const company = populatedApplication.companyId;

        // Create interview object for the email
        const interview = {
          applicationId: populatedApplication._id,
          scheduledAt: populatedApplication.interviewDetails?.date || new Date()
        };

        // Optional feedback object
        const feedback = comments ? {
          feedback: comments,
          strengths: 'your dedication and enthusiasm',
          recommendedSkills: 'relevant technical skills'
        } : null;

        await emailService.sendInterviewRejectionEmail(student, interview, job, company, feedback);
        console.log('✅ Interview rejection email sent successfully (company rejected)');
        
      } catch (emailError) {
        console.error('❌ Error sending company rejection email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Application ${status} by company`,
      data: application
    });

  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviewing application',
      error: error.message
    });
  }
};

// @desc    Get student's applications
// @route   GET /api/applications/student
// @access  Private (Student only)
const getStudentApplications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const applications = await Application.find({
      studentId
    })
    .populate('jobId', 'jobTitle companyName location jobDescription salary')
    .populate('supervisorId', 'name email')
    .populate('companyId', 'name email')
    .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      data: applications
    });

  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications',
      error: error.message
    });
  }
};

// @desc    Get all supervisors
// @route   GET /api/applications/supervisors
// @access  Private
const getSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({
      role: 'supervisor'
    }).select('name email supervisor.department supervisor.designation supervisor.maxStudents supervisor.currentStudents supervisor.expertise supervisor.phone supervisor.office supervisor.officeHours');

    // Transform the data to match frontend expectations
    const transformedSupervisors = supervisors.map(supervisor => ({
      _id: supervisor._id,
      id: supervisor._id, // For compatibility
      name: supervisor.name,
      email: supervisor.email,
      department: supervisor.supervisor?.department || 'Not specified',
      designation: supervisor.supervisor?.designation || 'Supervisor',
      maxStudents: supervisor.supervisor?.maxStudents || 10,
      currentStudents: supervisor.supervisor?.currentStudents || 0,
      expertise: supervisor.supervisor?.expertise || ['Machine Learning', 'Data Science'], // Default expertise
      phone: supervisor.supervisor?.phone || '+92-XXX-XXXXXXX',
      office: supervisor.supervisor?.office || 'Office not specified',
      officeHours: supervisor.supervisor?.officeHours || 'Mon-Fri, 9AM-5PM'
    }));

    res.status(200).json({
      success: true,
      data: transformedSupervisors
    });

  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supervisors',
      error: error.message
    });
  }
};

// @desc    Schedule interview for an application (Company only)
// @route   PATCH /api/applications/:id/interview
// @access  Private (Company only)
const scheduleInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, mode, location, notes } = req.body;
    const companyId = req.user.id;

    console.log('=== SCHEDULE INTERVIEW DEBUG ===');
    console.log('Application ID:', id);
    console.log('Request body:', req.body);
    console.log('Extracted data:', { date, mode, location, notes });
    console.log('Company ID:', companyId);

    // Find application
    const application = await Application.findById(id)
      .populate('studentId', 'name email')
      .populate('jobId', 'jobTitle companyName')
      .populate('supervisorId', 'name email')
      .populate('companyId', 'name email');
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    // Only allow if company owns the application
    if (application.companyId._id.toString() !== companyId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Only allow if supervisor has approved
    if (application.supervisorStatus !== 'approved') {
      return res.status(400).json({ success: false, message: 'Supervisor approval required before scheduling interview' });
    }

    // Parse the date and extract time if it's a combined datetime
    let interviewDate, interviewTime;
    
    console.log('📅 Date parsing debug:');
    console.log('Raw date from frontend:', date);
    
    if (date) {
      const dateObj = new Date(date);
      console.log('Parsed Date object:', dateObj);
      console.log('Is valid date?', !isNaN(dateObj.getTime()));
      
      interviewDate = dateObj;
      // Extract time in HH:MM format (24-hour format)
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      interviewTime = `${hours}:${minutes}`;
      
      console.log('Extracted time:', interviewTime);
      console.log('Final date:', interviewDate);
    }

    console.log('📝 Final interview details to save:');
    const interviewDetailsToSave = {
      type: mode || 'in-person',
      date: interviewDate,
      time: interviewTime,
      location: location || '',
      meetingLink: mode === 'remote' ? location : '',
      notes: notes || ''
    };
    console.log(JSON.stringify(interviewDetailsToSave, null, 2));

    // Update interview details with separate date and time
    application.interviewDetails = interviewDetailsToSave;
    
    application.applicationStatus = 'interview_scheduled';
    application.companyReviewedAt = new Date();
    await application.save();

    console.log('✅ Interview details saved to database:', application.interviewDetails);

    // Send email notifications
    try {
      const interview = {
        applicationId: application._id,
        scheduledAt: application.interviewDetails.date,
        mode: application.interviewDetails.type,
        location: application.interviewDetails.location,
        notes: application.interviewDetails.notes
      };
      
      // Email to student
      await emailService.sendInterviewScheduledEmail(
        application.studentId,
        interview,
        application.jobId,
        application.companyId,
        application.supervisorId
      );
      
      // Email to supervisor
      await emailService.sendInterviewScheduledEmailToSupervisor(
        application.supervisorId,
        interview,
        application.jobId,
        application.companyId,
        application.studentId
      );
      
      console.log('✅ Interview notification emails sent');
    } catch (emailErr) {
      console.error('❌ Error sending interview scheduled emails:', emailErr);
    }

    // In-app notifications
    try {
      await createApplicationNotification(
        application.studentId._id,
        application._id,
        'interview_scheduled',
        application.companyId.name,
        application.jobId.jobTitle,
        application.companyId.name,
        'Interview scheduled. Check your email for details.'
      );
      
      await createApplicationNotification(
        application.supervisorId._id,
        application._id,
        'interview_scheduled',
        application.companyId.name,
        application.jobId.jobTitle,
        application.companyId.name,
        'Interview scheduled for your supervised student.'
      );
      
      console.log('✅ In-app notifications sent');
    } catch (notifErr) {
      console.error('❌ Error creating interview notifications:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: application
    });
    
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while scheduling interview', 
      error: error.message 
    });
  }
};

// @desc    Update application status (for interview flow)
// @route   PATCH /api/applications/:id/status
// @access  Private (Company only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionNote, companyComments } = req.body;
    const companyId = req.user.id;

    console.log('=== UPDATE APPLICATION STATUS ===');
    console.log('Application ID:', id);
    console.log('New Status:', status);
    console.log('Company ID:', companyId);
    console.log('Rejection Note:', rejectionNote);
    console.log('Company Comments:', companyComments);

    // Validate status
    const validStatuses = ['pending', 'interview_scheduled', 'interview_done', 'hired', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find application
    const application = await Application.findById(id);
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
        message: 'Not authorized to update this application'
      });
    }

    // Update status and handle hiring logic
    application.applicationStatus = status;
    application.companyReviewedAt = new Date();
    
    // Add company comments if provided
    if (companyComments) {
      application.companyComments = companyComments;
    }
    
    // Add rejection note if status is rejected
    if (status === 'rejected' && rejectionNote) {
      application.companyRejectionNote = rejectionNote;
    }
    
    if (status === 'hired') {
      application.hiringDate = new Date();
      application.isCurrentlyHired = true;
      
      // CRITICAL FIX: Ensure overallStatus is set to 'approved' when hiring
      // This ensures hired students appear in the company's evaluation tab
      application.overallStatus = 'approved';
      application.companyStatus = 'approved';
      
      // Increment job's applicationsCount ONLY when student is hired
      await Job.findByIdAndUpdate(application.jobId, {
        $inc: { applicationsCount: 1 }
      });
      
      console.log(`✅ Job applicationsCount incremented for job ${application.jobId} - Student hired`);
      
      // Check if hired limit reached and close job if needed
      const job = await Job.findById(application.jobId);
      if (job && job.applicationsCount >= job.applicationLimit) {
        await Job.findByIdAndUpdate(application.jobId, {
          status: 'Closed'
        });
        console.log(`🚫 Job ${application.jobId} closed - hired student limit reached (${job.applicationsCount}/${job.applicationLimit})`);
      }
      
      // Mark other applications of this student as rejected (one job at a time)
      await Application.updateMany(
        { 
          studentId: application.studentId,
          _id: { $ne: application._id },
          applicationStatus: { $nin: ['hired', 'rejected'] }
        },
        { 
          applicationStatus: 'rejected',
          companyComments: 'Student hired for another position'
        }
      );
    }

    await application.save();

    // Populate for response and email notifications
    const updatedApplication = await Application.findById(id)
      .populate('studentId', 'name email')
      .populate('jobId', 'title company')
      .populate('supervisorId', 'name email')
      .populate('companyId', 'name email');

    // Send email notifications based on status change
    try {
      const student = updatedApplication.studentId;
      const job = updatedApplication.jobId;
      const company = updatedApplication.companyId;

      // Fetch complete student profile data from Student model for email templates
      const studentProfile = await Student.findById(student._id);
      
      // Create complete student object with profile data
      const completeStudentData = {
        ...student.toObject(),
        rollNo: studentProfile?.rollNo || 'Not Available',
        department: studentProfile?.department || 'Not Available',
        cgpa: studentProfile?.cgpa || 'Not Available'
      };

      if (status === 'hired') {
        console.log('📧 Sending hiring success email...');
        
        // Create offer object with details
        const offer = {
          _id: updatedApplication._id,
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default start date 1 week from now
          duration: job.duration || '3 months',
          stipend: job.stipend || 'As per company policy',
          location: job.location,
          reportingManager: 'HR Team',
          hrContact: company.email
        };

        // Create interview object for the email
        const interview = {
          applicationId: updatedApplication._id,
          scheduledAt: updatedApplication.interviewDetails?.date || new Date()
        };

        await emailService.sendInterviewSuccessEmail(completeStudentData, interview, job, company, offer);
        console.log('✅ Hiring success email sent successfully');
        
      } else if (status === 'rejected') {
        console.log('📧 Sending interview rejection email...');
        
        // Create interview object for the email
        const interview = {
          applicationId: updatedApplication._id,
          scheduledAt: updatedApplication.interviewDetails?.date || new Date()
        };

        // Optional feedback object
        const feedback = rejectionNote ? {
          feedback: rejectionNote,
          strengths: 'your dedication and enthusiasm',
          recommendedSkills: 'relevant technical skills'
        } : null;

        await emailService.sendInterviewRejectionEmail(completeStudentData, interview, job, company, feedback);
        console.log('✅ Interview rejection email sent successfully');
      }
    } catch (emailError) {
      console.error('❌ Error sending status update email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      data: updatedApplication
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application status',
      error: error.message
    });
  }
};


// @desc    Download student file (CV or certificate)
// @route   GET /api/applications/:id/download/:fileType/:fileName
// @access  Private (Supervisor/Company only)
const downloadStudentFile = async (req, res) => {
  try {
    const { id, fileType, fileName } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('=== FILE DOWNLOAD REQUEST ===');
    console.log('Application ID:', id);
    console.log('File Type:', fileType);
    console.log('File Name:', fileName);
    console.log('User Role:', userRole);

    // Validate file type
    if (!['cv', 'certificate'].includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Must be cv or certificate'
      });
    }

    // Get application with authorization check
    let application;
    if (userRole === 'supervisor') {
      application = await Application.findOne({
        _id: id,
        supervisorId: userId
      });
    } else if (userRole === 'company') {
      application = await Application.findOne({
        _id: id,
        companyId: userId
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only supervisors and companies can download files'
      });
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or access denied'
      });
    }

    let filePath;
    let originalName;

    // Get file path based on type
    if (fileType === 'cv') {
      if (!application.studentProfile.cv || !application.studentProfile.cv.path) {
        return res.status(404).json({
          success: false,
          message: 'CV not found for this application'
        });
      }
      if (application.studentProfile.cv.filename !== fileName) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }
      filePath = application.studentProfile.cv.path;
      originalName = application.studentProfile.cv.originalName;
    } else if (fileType === 'certificate') {
      const certificate = application.studentProfile.certificates.find(
        cert => cert.filename === fileName
      );
      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      filePath = certificate.path;
      originalName = certificate.originalName;
    }

    // Check if file exists on disk
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error downloading file'
        });
      }
    });

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading file',
      error: error.message
    });
  }
};

// @desc    Preview student file (CV or certificate) - for viewing in browser
// @route   GET /api/applications/:id/preview/:fileType/:fileName
// @access  Private (Supervisor/Company only)
const previewStudentFile = async (req, res) => {
  try {
    const { id, fileType, fileName } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('=== FILE PREVIEW REQUEST ===');
    console.log('Application ID:', id);
    console.log('File Type:', fileType);
    console.log('File Name:', fileName);
    console.log('User Role:', userRole);

    // Validate file type
    if (!['cv', 'certificate'].includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Must be cv or certificate'
      });
    }

    // Get application with authorization check
    let application;
    if (userRole === 'supervisor') {
      application = await Application.findOne({
        _id: id,
        supervisorId: userId
      });
    } else if (userRole === 'company') {
      application = await Application.findOne({
        _id: id,
        companyId: userId
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only supervisors and companies can preview files'
      });
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or access denied'
      });
    }

    let filePath;
    let mimeType = 'application/octet-stream';

    // Get file path based on type
    if (fileType === 'cv') {
      if (!application.studentProfile.cv || !application.studentProfile.cv.path) {
        return res.status(404).json({
          success: false,
          message: 'CV not found for this application'
        });
      }
      if (application.studentProfile.cv.filename !== fileName) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }
      filePath = application.studentProfile.cv.path;
    } else if (fileType === 'certificate') {
      const certificate = application.studentProfile.certificates.find(
        cert => cert.filename === fileName
      );
      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }
      filePath = certificate.path;
    }

    // Check if file exists on disk
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Determine MIME type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    switch (ext) {
      case '.pdf':
        mimeType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.doc':
        mimeType = 'application/msword';
        break;
      case '.docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      default:
        mimeType = 'application/octet-stream';
    }

    // Set headers for inline viewing
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', 'inline');

    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file for preview:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error previewing file'
        });
      }
    });

  } catch (error) {
    console.error('Error previewing file:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while previewing file',
      error: error.message
    });
  }
};

// @desc    Get accepted/hired students for company
// @route   GET /api/applications/company/accepted
// @access  Private (Company only)
const getCompanyAcceptedApplications = async (req, res) => {
  try {
    const companyId = req.user.id;

    console.log('📋 Fetching accepted applications for company:', companyId);

    const applications = await Application.find({
      companyId,
      overallStatus: 'approved'
    })
    .sort({ updatedAt: -1 });

    console.log(`✅ Found ${applications.length} accepted applications for company ${companyId}`);

    // Transform the data to match frontend expectations
    const transformedApplications = applications.map(app => ({
      _id: app._id,
      studentId: app.studentId,
      studentName: app.studentName,
      studentEmail: app.studentEmail,
      studentRollNumber: app.studentProfile?.rollNumber || 'N/A',
      studentDepartment: app.studentProfile?.department || 'Computer Science',
      studentSemester: app.studentProfile?.semester || 'N/A',
      studentCGPA: app.studentProfile?.cgpa || 'N/A',
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      supervisorId: app.supervisorId,
      supervisorName: app.supervisorName,
      appliedAt: app.appliedAt,
      approvedAt: app.updatedAt,
      overallStatus: app.overallStatus
    }));

    res.status(200).json({
      success: true,
      data: transformedApplications
    });

  } catch (error) {
    console.error('Error fetching company accepted applications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching accepted applications',
      error: error.message
    });
  }
};

// @desc    Get hired students with offer letter details for supervisor evaluations
// @route   GET /api/applications/supervisor/hired-students
// @access  Private (Supervisor only)
const getHiredStudentsForEvaluation = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const OfferLetter = require('../models/OfferLetter');

    console.log('🎓 Fetching hired students for supervisor:', supervisorId);

    // Get all hired applications for this supervisor
    const hiredApplications = await Application.find({
      supervisorId,
      isCurrentlyHired: true,
      overallStatus: 'approved'
    })
    .populate({
      path: 'studentId',
      select: 'name email student profile department'
    })
    .populate({
      path: 'jobId',
      select: 'jobTitle location workType duration salary',
      populate: {
        path: 'companyId',
        select: 'name'
      }
    })
    .sort({ hiringDate: -1 });

    console.log('📊 Found hired applications:', hiredApplications.length);

    // For each hired application, get the corresponding offer letter for internship dates
    const studentsWithOfferDetails = await Promise.all(
      hiredApplications.map(async (application) => {
        try {
          // Find the offer letter for this application
          const offerLetter = await OfferLetter.findOne({
            studentId: application.studentId._id,
            status: { $in: ['accepted', 'sent'] } // Check both accepted and sent status
          });

          console.log(`Offer letter for ${application.studentId.name}:`, offerLetter ? 'Found' : 'Not found');
          if (offerLetter) {
            console.log(`📅 Offer letter dates:`, {
              status: offerLetter.status,
              startDate: offerLetter.startDate,
              endDate: offerLetter.endDate
            });
          }

          // Calculate duration if dates are available
          let duration = application.jobId?.duration || 'N/A';
          let startDate = null;
          let endDate = null;

          // Priority: Offer letter dates > Application dates
          if (offerLetter && offerLetter.startDate && offerLetter.endDate) {
            startDate = offerLetter.startDate;
            endDate = offerLetter.endDate;
            console.log(`✅ Using offer letter dates for ${application.studentId.name}`);
          } else if (application.startDate && application.endDate) {
            // Fallback to application dates if offer letter dates not available
            startDate = application.startDate;
            endDate = application.endDate;
            console.log(`⚠️ Using application dates for ${application.studentId.name}`);
          } else {
            console.log(`❌ No dates found for ${application.studentId.name}`);
          }

          // If no duration from job, calculate from dates
          if (duration === 'N/A' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const months = Math.ceil(diffDays / 30);
            duration = `${months} month${months !== 1 ? 's' : ''}`;
          }

          console.log(`Debug student data for ${application.studentId.name}:`, {
            'studentId.department': application.studentId.department,
            'studentId.student.department': application.studentId.student?.department,
            'studentProfile.department': application.studentProfile?.department,
            'application.department': application.department,
            'jobId.jobTitle': application.jobId?.jobTitle,
            'application.jobPosition': application.jobPosition
          });

          return {
            studentId: application.studentId._id,
            name: application.studentId.name,
            email: application.studentId.email,
            registrationNumber: application.studentId.student?.regNo || application.studentProfile?.rollNumber || 'N/A',
            department: application.studentProfile?.department || application.studentId.student?.department || application.studentId.department || 'Computer Science',
            semester: application.studentProfile?.semester || application.studentId.student?.semester || 'N/A',
            jobTitle: application.jobPosition || application.jobId?.jobTitle || 'Software Developer',
            companyName: application.jobId?.companyId?.name || 'TechCorp',
            internshipStartDate: startDate,
            internshipEndDate: endDate,
            internshipDuration: duration,
            hiringDate: application.hiringDate,
            applicationId: application._id
          };
        } catch (error) {
          console.error('Error processing application:', error);
          return null;
        }
      })
    );

    // Filter out any null entries
    const validStudents = studentsWithOfferDetails.filter(student => student !== null);

    console.log('Processed students with offer details:', validStudents.length);

    res.status(200).json({
      success: true,
      data: validStudents
    });

  } catch (error) {
    console.error('Error fetching hired students for evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hired students',
      error: error.message
    });
  }
};

module.exports = {
  submitApplication,
  getSupervisorApplications,
  getSupervisorPendingApplications,
  supervisorReviewApplication,
  supervisorRejectWithFeedback,
  studentResubmitApplication,
  supervisorApproveApplication,
  getCompanyApplications,
  getCompanyAcceptedApplications,
  companyReviewApplication,
  getStudentApplications,
  getSupervisors,
  updateApplicationStatus,
  scheduleInterview,
  downloadStudentFile,
  previewStudentFile,
  getHiredStudentsForEvaluation
};
