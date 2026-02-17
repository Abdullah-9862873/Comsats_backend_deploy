const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'abdullahjaveda47@gmail.com',
        pass: process.env.EMAIL_PASS || 'ddqa yfch datd tyok'
      }
    });

    this.fromName = process.env.EMAIL_FROM_NAME || 'COMSATS Internship Portal';
    this.fromEmail = process.env.EMAIL_USER || 'abdullahjaveda47@gmail.com';
    
    // Register handlebars helpers
    this.setupHandlebarsHelpers();
  }

  // Setup handlebars helpers
  setupHandlebarsHelpers() {
    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    handlebars.registerHelper('ne', function (a, b) {
      return a !== b;
    });

    handlebars.registerHelper('if_eq', function (a, b, opts) {
      if (a === b) {
        return opts.fn(this);
      } else {
        return opts.inverse(this);
      }
    });
  }

  // Test email connection
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  // Load and compile template
  loadTemplate(templateName, isHtml = true) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.${isHtml ? 'hbs' : 'txt'}`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      return handlebars.compile(templateSource);
    } catch (error) {
      console.error(`❌ Error loading email template ${templateName}:`, error);
      throw new Error(`Email template ${templateName} not found`);
    }
  }

  // Send email with template
  async sendTemplate(to, subject, templateName, context = {}) {
    try {
      console.log(`📧 Sending email to: ${to} with template: ${templateName}`);

      // Load HTML template
      const htmlTemplate = this.loadTemplate(templateName, true);
      const htmlContent = htmlTemplate(context);

      // Create simple text fallback from HTML
      const textContent = `
${subject}

Hello ${context.name || 'User'},

${templateName === 'reset-password' ? 
  `We received a request to reset your password for your COMSATS Internship Portal account (${context.email}).

If you made this request, copy and paste this link into your browser:
${context.resetLink}

This link expires in 1 hour for your security.` :
  `Please view this email in an HTML-compatible email client for the best experience.

If you're having trouble viewing this email, please contact support.`}

Best regards,
COMSATS Internship Portal Team

---
This email is best viewed in HTML format. If you see this text, your email client may not support HTML emails.
      `.trim();

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent,
        headers: {
          'Content-Type': 'multipart/alternative',
          'X-Mailer': 'COMSATS Internship Portal'
        },
        attachDataUrls: true
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send simple email
  async sendSimple(to, subject, htmlContent, textContent) {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text fallback
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Simple email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Error sending simple email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send verification email
  async sendVerificationEmail(user, verificationToken) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
      
      const context = {
        name: user.name,
        email: user.email,
        verificationUrl: verificationUrl,
        verificationToken: verificationToken,
        currentYear: new Date().getFullYear()
      };

      const subject = 'Verify Your Email - COMSATS Internship Portal';
      
      console.log(`📧 Sending verification email to: ${user.email}`);
      return await this.sendTemplate(user.email, subject, 'verify-email', context);

    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      const context = {
        name: user.name,
        email: user.email,
        role: user.role,
        resetLink: resetUrl,
        resetToken: resetToken,
        currentTime: new Date().toLocaleString(),
        expiryTime: expiryTime.toLocaleString(),
        currentYear: new Date().getFullYear()
      };

      const subject = 'Reset Your Password - COMSATS Internship Portal';
      
      console.log(`🔑 Sending password reset email to: ${user.email}`);
      return await this.sendTemplate(user.email, subject, 'reset-password', context);

    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email based on user role
  async sendWelcomeEmail(user) {
    try {
      const context = {
        name: user.name,
        email: user.email,
        role: user.role,
        dashboardUrl: this.getDashboardUrl(user.role),
        currentYear: new Date().getFullYear()
      };

      let subject;
      switch (user.role) {
        case 'student':
          subject = 'Welcome to COMSATS Internship Portal - Start Your Journey!';
          break;
        case 'company':
          subject = 'Welcome to COMSATS Internship Portal - Find Talented Interns!';
          break;
        case 'supervisor':
          subject = 'Welcome to COMSATS Internship Portal - Guide Future Professionals!';
          break;
        default:
          subject = 'Welcome to COMSATS Internship Portal!';
      }

      return await this.sendTemplate(user.email, subject, 'welcome', context);

    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send supervisor acceptance email
  async sendSupervisorAcceptedEmail(student, supervisor) {
    try {
      const context = {
        studentName: student.name,
        studentEmail: student.email,
        studentRollNo: student.rollNo,
        supervisorName: supervisor.name,
        supervisorDepartment: supervisor.department,
        supervisorEmail: supervisor.email,
        supervisorOffice: supervisor.officeLocation || 'To be confirmed',
        supervisorPhone: supervisor.phone || 'Contact via email',
        dashboardUrl: this.getDashboardUrl('student'),
        contactSupervisorUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/student/supervisor`,
        currentYear: new Date().getFullYear()
      };

      const subject = `🎉 Supervisor Selection Approved - ${supervisor.name}`;
      
      console.log(`👨‍🏫 Sending supervisor acceptance email to: ${student.email}`);
      return await this.sendTemplate(student.email, subject, 'supervisor-accepted', context);

    } catch (error) {
      console.error('❌ Error sending supervisor acceptance email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send job application approved email
  async sendJobApprovedEmail(student, application, job, company) {
    try {
      const context = {
        studentName: student.name,
        studentEmail: student.email,
        studentRollNo: student.rollNo || student.studentProfile?.rollNo || 'N/A',
        
        // Job and Company Details (template expects these exact names)
        jobTitle: job.title || job.jobTitle || 'Internship Position',
        companyName: company.name || company.companyName || 'Company',
        department: student.department || student.studentProfile?.department || 'Computer Science',
        jobDescription: job.description || job.jobDescription || 'Internship opportunity',
        jobRequirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements || 'As specified in job posting',
        jobLocation: job.location || company.location || 'Company Office',
        companyLocation: company.location || company.address || 'Company Office',
        jobType: job.type || 'Internship',
        jobDuration: job.duration || '3 months',
        stipend: job.stipend || job.salary || 'As per company policy',
        
        // Application Details
        applicationId: application._id,
        applicationDate: new Date(application.appliedAt).toLocaleDateString(),
        supervisorName: application.supervisorName || 'Your Supervisor',
        approvalDate: new Date().toLocaleDateString(),
        
        // URLs
        dashboardUrl: this.getDashboardUrl('student'),
        viewApplicationUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/student/applications/${application._id}`,
        jobDetailsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/student/jobs/${job._id}`,
        currentYear: new Date().getFullYear()
      };

      const subject = `✅ Application Approved - ${job.title} at ${company.name}`;
      
      console.log(`📋 Sending job approval email to: ${student.email}`);
      return await this.sendTemplate(student.email, subject, 'job-application-approved', context);

    } catch (error) {
      console.error('❌ Error sending job approval email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send interview scheduled email
  async sendInterviewScheduledEmail(student, interview, job, company) {
    try {
      const interviewDate = new Date(interview.scheduledAt);
      
      const context = {
        studentName: student.name,
        studentEmail: student.email,
        studentRollNo: student.rollNo || student.studentProfile?.rollNo || 'N/A',
        
        // Job and Company Details (template expects these exact names)
        jobTitle: job.title || job.jobTitle || 'Internship Position',
        companyName: company.name || company.companyName || 'Company',
        department: student.department || student.studentProfile?.department || 'Computer Science',
        companyLocation: company.location || company.address || 'Company Office',
        
        // Interview Details (template expects these exact names)
        interviewDate: interviewDate.toLocaleDateString(),
        interviewTime: interviewDate.toLocaleTimeString(),
        interviewDateTime: interviewDate.toLocaleString(),
        interviewType: interview.type || 'In-person',
        interviewLocation: interview.location || company.location || 'Company office',
        interviewAddress: interview.location || company.address || 'Company office address',
        interviewLink: interview.meetingLink || null,
        meetingLink: interview.meetingLink || null,
        interviewDuration: interview.duration || '45 minutes',
        interviewInstructions: interview.instructions || 'Please arrive 10 minutes early',
        interviewNotes: interview.notes || interview.instructions || 'Please arrive 10 minutes early',
        
        // Interviewer Details (template expects these exact names)
        interviewerName: interview.interviewerName || 'HR Team',
        interviewerContact: interview.interviewerContact || company.email,
        interviewerEmail: interview.interviewerContact || company.email,
        hrContact: company.email,
        
        // URLs and IDs
        applicationId: interview.applicationId,
        dashboardUrl: this.getDashboardUrl('student'),
        confirmInterviewUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/student/interviews/${interview._id}/confirm`,
        currentYear: new Date().getFullYear()
      };

      const subject = `📅 Interview Scheduled - ${job.title} at ${company.name}`;
      
      console.log(`🎤 Sending interview scheduled email to: ${student.email}`);
      return await this.sendTemplate(student.email, subject, 'interview-scheduled', context);

    } catch (error) {
      console.error('❌ Error sending interview scheduled email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send interview result email (hired)
  async sendInterviewSuccessEmail(student, interview, job, company, offer) {
    try {
      const startDate = offer.startDate ? new Date(offer.startDate) : null;
      const endDate = startDate && offer.duration ? 
        new Date(startDate.getTime() + (parseInt(offer.duration) || 3) * 30 * 24 * 60 * 60 * 1000) : null;
      
      const context = {
        studentName: student.name,
        studentEmail: student.email,
        studentRollNo: student.rollNo || student.studentProfile?.rollNo || 'N/A',
        
        // Job and Company Details (template expects these exact names)
        jobTitle: job.title || job.jobTitle || 'Internship Position',
        companyName: company.name || company.companyName || 'Company',
        department: student.department || student.studentProfile?.department || 'Computer Science',
        companyLocation: company.location || company.address || 'Office Location',
        
        // Interview Details
        interviewDate: new Date(interview.scheduledAt).toLocaleDateString(),
        decisionDate: new Date().toLocaleDateString(),
        
        // Offer Details (template expects these exact names)
        startDate: startDate ? startDate.toLocaleDateString() : 'To be determined',
        endDate: endDate ? endDate.toLocaleDateString() : 'To be determined',
        internshipDuration: offer.duration || job.duration || '3 months',
        duration: offer.duration || job.duration || '3 months',
        stipend: offer.stipend || job.stipend || job.salary || 'As per company policy',
        workLocation: offer.location || job.location || company.location || 'Company Office',
        location: offer.location || job.location || company.location || 'Company Office',
        
        // Manager Details (template expects these exact names)
        reportingManager: offer.reportingManager || 'HR Team',
        managerName: offer.reportingManager || 'HR Manager',
        managerTitle: offer.managerTitle || 'HR Manager',
        managerEmail: offer.hrContact || company.email,
        hrContact: offer.hrContact || company.email,
        
        // URLs and IDs
        offerId: offer._id,
        applicationId: interview.applicationId,
        acceptOfferUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/student/offers/${offer._id}/accept`,
        viewOfferDetailsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/student/offers/${offer._id}`,
        dashboardUrl: this.getDashboardUrl('student'),
        currentYear: new Date().getFullYear()
      };

      const subject = `🎉 Congratulations! Offer Letter from ${company.name}`;
      
      console.log(`🎊 Sending interview success email to: ${student.email}`);
      return await this.sendTemplate(student.email, subject, 'interview-success-hired', context);

    } catch (error) {
      console.error('❌ Error sending interview success email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send interview result email (rejected)
  async sendInterviewRejectionEmail(student, interview, job, company, feedback = null) {
    try {
      const context = {
        studentName: student.name,
        studentEmail: student.email,
        companyName: company.name,
        jobTitle: job.title,
        interviewDate: new Date(interview.scheduledAt).toLocaleDateString(),
        decisionDate: new Date().toLocaleDateString(),
        applicationId: interview.applicationId,
        feedback: feedback?.feedback || null,
        strengths: feedback?.strengths || 'your dedication and enthusiasm',
        recommendedSkills: feedback?.recommendedSkills || 'relevant technical skills',
        futureOpportunities: feedback?.futureOpportunities || null,
        findMoreJobsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/student/jobs`,
        skillDevelopmentUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/student/resources`,
        dashboardUrl: this.getDashboardUrl('student'),
        currentYear: new Date().getFullYear()
      };

      const subject = `Interview Update - ${job.title} at ${company.name}`;
      
      console.log(`📧 Sending interview rejection email to: ${student.email}`);
      return await this.sendTemplate(student.email, subject, 'interview-result-rejected', context);

    } catch (error) {
      console.error('❌ Error sending interview rejection email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send general notification email
  async sendNotificationEmail(recipient, subject, message, priority = 'normal') {
    try {
      const context = {
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        message: message,
        priority: priority,
        timestamp: new Date().toLocaleString(),
        dashboardUrl: this.getDashboardUrl(recipient.role),
        currentYear: new Date().getFullYear()
      };

      console.log(`🔔 Sending notification email to: ${recipient.email}`);
      return await this.sendTemplate(recipient.email, subject, 'notification', context);

    } catch (error) {
      console.error('❌ Error sending notification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send final evaluation results email to student
  async sendFinalEvaluationEmail(student, supervisor, evaluation, internshipInfo) {
    try {
      const context = {
        studentName: student.name,
        studentEmail: student.email,
        studentRollNo: student.rollNo || student.rollNumber || student.registrationNumber || 'N/A',
        studentDepartment: student.department || 'N/A',
        
        // Supervisor Information
        supervisorName: supervisor.name,
        supervisorEmail: supervisor.email,
        
        // Internship Information
        companyName: internshipInfo.companyName || 'Company',
        jobTitle: internshipInfo.position || 'Internship Position',
        
        // Evaluation Results
        totalMarks: evaluation.totalMarks,
        supervisorMarks: evaluation.supervisorMarks,
        companyMarks: evaluation.companyMarks,
        grade: evaluation.grade,
        submissionDate: new Date().toLocaleDateString(),
        
        // URLs
        dashboardUrl: this.getDashboardUrl('student'),
        resultsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/student/results`,
        currentYear: new Date().getFullYear()
      };

      // Create grade-based subject line
      let subjectPrefix = '📋';
      if (evaluation.grade === 'A+' || evaluation.grade === 'A') {
        subjectPrefix = '🎉';
      } else if (evaluation.grade.startsWith('B')) {
        subjectPrefix = '👏';
      } else if (evaluation.grade.startsWith('C')) {
        subjectPrefix = '✅';
      }

      const subject = `${subjectPrefix} Final Internship Results - Grade: ${evaluation.grade}`;
      
      console.log(`📧 Sending final evaluation results to student: ${student.email}`);
      return await this.sendTemplate(student.email, subject, 'final-evaluation-results', context);

    } catch (error) {
      console.error('❌ Error sending final evaluation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send interview scheduled email to supervisor
  async sendInterviewScheduledEmailToSupervisor(supervisor, interview, job, company, student) {
    try {
      const interviewDate = new Date(interview.scheduledAt);
      
      const context = {
        supervisorName: supervisor.name,
        studentName: student.name,
        studentEmail: student.email,
        studentRollNo: student.rollNo || student.studentProfile?.rollNo || 'N/A',
        
        // Job and Company Details
        jobTitle: job.title || job.jobTitle || 'Internship Position',
        companyName: company.name || company.companyName || 'Company',
        department: student.department || student.studentProfile?.department || 'Computer Science',
        
        // Interview Details
        interviewDate: interviewDate.toLocaleDateString(),
        interviewTime: interviewDate.toLocaleTimeString(),
        interviewDateTime: interviewDate.toLocaleString(),
        interviewType: interview.mode || 'In-person',
        interviewLocation: interview.location || company.location || 'Company office',
        interviewNotes: interview.notes || 'No additional notes provided',
        
        // URLs
        applicationId: interview.applicationId,
        dashboardUrl: this.getDashboardUrl('supervisor'),
        currentYear: new Date().getFullYear()
      };

      const subject = `📅 Interview Scheduled - ${student.name} for ${job.title} at ${company.name}`;
      
      console.log(`🎤 Sending interview scheduled notification to supervisor: ${supervisor.email}`);
      return await this.sendTemplate(supervisor.email, subject, 'supervisor-interview-notification', context);

    } catch (error) {
      console.error('❌ Error sending supervisor interview notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send supervisor evaluation notification email
  async sendSupervisorEvaluationNotification(supervisor, student, company, evaluation, job) {
    try {
      const percentage = ((evaluation.totalMarks / evaluation.maxMarks) * 100).toFixed(2);
      
      const context = {
        supervisorName: supervisor.name,
        supervisorEmail: supervisor.email,
        
        // Student Information (template expects these exact names)
        studentName: student.name,
        studentEmail: student.email,
        studentRollNo: student.rollNo || student.rollNumber || student.studentProfile?.rollNo || student.studentProfile?.rollNumber || 'N/A',
        studentDepartment: student.department || student.studentProfile?.department || 'N/A',
        
        // Company Information (template expects these exact names)
        companyName: company?.company?.companyName || company?.name || 'Company',
        jobTitle: job?.title || job?.jobTitle || 'Internship Position',
        
        // Evaluation Details (template expects these exact names)
        totalMarks: evaluation.totalMarks,
        maxMarks: evaluation.maxMarks,
        percentage: percentage,
        evaluationDate: new Date().toLocaleDateString(),
        supervisorComments: evaluation.supervisorComments || null,
        
        // URLs
        dashboardUrl: this.getDashboardUrl('supervisor'),
        evaluationDetailsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/supervisor/evaluations`,
        currentYear: new Date().getFullYear()
      };

      const subject = `📋 Student Evaluation Completed - ${student.name} by ${company.name}`;
      
      console.log(`📧 Sending evaluation notification to supervisor: ${supervisor.email}`);
      return await this.sendTemplate(supervisor.email, subject, 'supervisor-evaluation-notification', context);

    } catch (error) {
      console.error('❌ Error sending supervisor evaluation notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send student evaluation notification email (without marks)
  async sendStudentEvaluationNotification(student, company, supervisor, job) {
    try {
      const context = {
        studentName: student.name,
        studentEmail: student.email,
        
        companyName: company?.company?.companyName || company?.name || 'Your Company',
        jobTitle: job?.title || job?.jobTitle || 'Internship Position',
        
        supervisorName: supervisor?.name || 'Your Supervisor',
        
        evaluationDate: new Date().toLocaleDateString(),
        dashboardUrl: this.getDashboardUrl('student'),
        currentYear: new Date().getFullYear()
      };

      const subject = `✅ Internship Evaluation Completed by ${company?.company?.companyName || company?.name}`;
      
      console.log(`📧 Sending evaluation notification to student: ${student.email}`);
      return await this.sendTemplate(student.email, subject, 'student-evaluation-notification', context);

    } catch (error) {
      console.error('❌ Error sending student evaluation notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get dashboard URL based on role
  getDashboardUrl(role) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    switch (role) {
      case 'student':
        return `${baseUrl}/dashboard/student`;
      case 'company':
        return `${baseUrl}/dashboard/company`;
      case 'supervisor':
        return `${baseUrl}/dashboard/supervisor`;
      default:
        return `${baseUrl}/dashboard`;
    }
  }
}

module.exports = new EmailService();