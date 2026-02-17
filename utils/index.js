const nodemailer = require('nodemailer');
const PDFKit = require('pdfkit');
const User = require('../models/User');
const Student = require('../models/Student');
const Application = require('../models/Application');

/**
 * Email Service Configuration
 */
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

/**
 * Send Broadcast Email to Multiple Recipients
 */
const sendBroadcastEmail = async ({ recipients, subject, message, type, sentBy }) => {
  try {
    const transporter = createEmailTransporter();
    
    // Get recipient emails based on type
    let recipientEmails = [];
    
    if (recipients === 'all') {
      const users = await User.find({ isVerified: true }).select('email');
      recipientEmails = users.map(user => user.email);
    } else {
      const users = await User.find({ 
        role: recipients, 
        isVerified: true 
      }).select('email');
      recipientEmails = users.map(user => user.email);
    }

    // Email template based on type
    const getEmailTemplate = (type, message) => {
      const typeStyles = {
        info: { color: '#3B82F6', icon: 'ℹ️' },
        warning: { color: '#F59E0B', icon: '⚠️' },
        urgent: { color: '#EF4444', icon: '🚨' }
      };

      const style = typeStyles[type] || typeStyles.info;

      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${style.color}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">
              ${style.icon} ${subject}
            </h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 25px; border-radius: 8px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
              <p>This is an official communication from COMSATS Internship Portal</p>
              <p>Please do not reply to this email</p>
            </div>
          </div>
        </div>
      `;
    };

    // Send emails in batches to avoid rate limiting
    const batchSize = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipientEmails.length; i += batchSize) {
      const batch = recipientEmails.slice(i, i + batchSize);
      
      const promises = batch.map(async (email) => {
        try {
          await transporter.sendMail({
            from: `"COMSATS Internship Portal" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: subject,
            html: getEmailTemplate(type, message)
          });
          return { success: true };
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          return { success: false };
        }
      });

      const results = await Promise.all(promises);
      sent += results.filter(r => r.success).length;
      failed += results.filter(r => !r.success).length;

      // Add delay between batches
      if (i + batchSize < recipientEmails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      sent,
      failed,
      total: recipientEmails.length
    };
  } catch (error) {
    console.error('Broadcast email error:', error);
    throw new Error('Failed to send broadcast email');
  }
};

/**
 * Generate Completion Certificate PDF
 */
const generateCertificatePDF = async ({ studentId, internshipId, template, generatedBy }) => {
  try {
    // Fetch student and internship data
    const [student, application] = await Promise.all([
      User.findById(studentId).select('name email'),
      Application.findById(internshipId)
        .populate('companyId', 'companyName')
        .populate('jobId', 'title duration')
    ]);

    if (!student || !application) {
      throw new Error('Student or internship not found');
    }

    const studentProfile = await Student.findOne({ 
      $or: [
        { rollNumber: student.rollNumber },
        { email: student.email }
      ]
    });

    // Create PDF document
    const doc = new PDFKit({
      size: 'A4',
      layout: 'landscape',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Certificate templates
    const templates = {
      default: generateDefaultCertificate,
      honors: generateHonorsCertificate,
      standard: generateStandardCertificate
    };

    const generateTemplate = templates[template] || templates.default;
    
    // Generate certificate content
    await generateTemplate(doc, {
      student,
      studentProfile,
      application,
      generatedDate: new Date()
    });

    // End the document
    doc.end();

    // Convert to buffer
    return new Promise((resolve, reject) => {
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    throw new Error('Failed to generate certificate');
  }
};

/**
 * Default Certificate Template
 */
const generateDefaultCertificate = async (doc, data) => {
  const { student, studentProfile, application, generatedDate } = data;

  // Header
  doc.fontSize(32)
     .fillColor('#1f2937')
     .text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center' });

  // Subtitle
  doc.fontSize(18)
     .fillColor('#6b7280')
     .text('Internship Program', 0, 150, { align: 'center' });

  // Main content
  doc.fontSize(16)
     .fillColor('#1f2937')
     .text('This is to certify that', 0, 220, { align: 'center' });

  doc.fontSize(28)
     .fillColor('#3b82f6')
     .text(student.name, 0, 260, { align: 'center' });

  doc.fontSize(16)
     .fillColor('#1f2937')
     .text('has successfully completed an internship program in', 0, 310, { align: 'center' });

  doc.fontSize(22)
     .fillColor('#1f2937')
     .text(application.jobId?.title || 'Software Development', 0, 350, { align: 'center' });

  doc.fontSize(16)
     .text(`at ${application.companyId?.companyName || 'Tech Company'}`, 0, 390, { align: 'center' });

  // Duration and details
  doc.fontSize(14)
     .fillColor('#6b7280')
     .text(`Duration: ${application.jobId?.duration || '3 months'}`, 0, 450, { align: 'center' });

  doc.text(`Roll Number: ${studentProfile?.rollNumber || 'N/A'}`, 0, 470, { align: 'center' });
  doc.text(`Department: ${studentProfile?.department || 'Computer Science'}`, 0, 490, { align: 'center' });

  // Footer
  doc.fontSize(12)
     .text(`Generated on: ${generatedDate.toLocaleDateString()}`, 0, 560, { align: 'center' });

  doc.text('COMSATS University Islamabad', 0, 580, { align: 'center' });

  // Add border
  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
     .stroke('#3b82f6');
};

/**
 * Honors Certificate Template
 */
const generateHonorsCertificate = async (doc, data) => {
  // Similar to default but with honors styling
  generateDefaultCertificate(doc, data);
  
  // Add honors badge
  doc.fontSize(14)
     .fillColor('#f59e0b')
     .text('🏆 WITH HONORS', 0, 520, { align: 'center' });
};

/**
 * Standard Certificate Template
 */
const generateStandardCertificate = async (doc, data) => {
  // Simplified version of default template
  generateDefaultCertificate(doc, data);
};

/**
 * Validate Email Domain Against Blocked List
 */
const isEmailDomainBlocked = async (email) => {
  try {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    const BlockedDomain = require('../models/BlockedDomain');
    const blockedDomain = await BlockedDomain.findOne({ 
      domain, 
      isActive: true 
    });

    if (blockedDomain) {
      // Increment blocked count
      await BlockedDomain.findByIdAndUpdate(
        blockedDomain._id,
        { $inc: { blockedCount: 1 } }
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Email domain validation error:', error);
    return false;
  }
};

/**
 * Send Single Email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createEmailTransporter();
    
    const info = await transporter.sendMail({
      from: `"COMSATS Internship Portal" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
      text
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Send email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendBroadcastEmail,
  generateCertificatePDF,
  isEmailDomainBlocked,
  sendEmail
};