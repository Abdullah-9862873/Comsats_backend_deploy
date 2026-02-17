const Setting = require('../models/Setting');
const BlockedDomain = require('../models/BlockedDomain');
const WeeklyReport = require('../models/WeeklyReport');
const InternshipReport = require('../models/InternshipReport');
const MisconductReport = require('../models/MisconductReport');
const { createAuditLog } = require('../middleware/adminAuth');
const { sendBroadcastEmail, generateCertificatePDF } = require('../utils');

/**
 * Get System Settings
 */
const getSettings = async (req, res) => {
  try {
    const { category } = req.query;
    
    const filter = {};
    if (category) filter.category = category;

    const settings = await Setting.find(filter)
      .populate('updatedBy', 'name email')
      .sort({ category: 1, key: 1 });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
};

/**
 * Update System Setting
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await Setting.findOneAndUpdate(
      { key },
      { 
        value, 
        description,
        updatedBy: req.user._id 
      },
      { new: true, upsert: true }
    );

    // Create audit log
    await createAuditLog(req.auditInfo, {
      details: {
        settingKey: key,
        newValue: value,
        description
      }
    });

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
};

/**
 * Get Blocked Domains
 */
const getBlockedDomains = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = ''
    } = req.query;

    const filter = { isActive: true };
    if (search) {
      filter.domain = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [domains, total] = await Promise.all([
      BlockedDomain.find(filter)
        .populate('addedBy', 'name email')
        .sort({ domain: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BlockedDomain.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        domains,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get blocked domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blocked domains'
    });
  }
};

/**
 * Add Blocked Domain
 */
const addBlockedDomain = async (req, res) => {
  try {
    const { domain, reason } = req.body;

    // Check if domain already exists
    const existingDomain = await BlockedDomain.findOne({ domain: domain.toLowerCase() });
    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is already blocked'
      });
    }

    const blockedDomain = new BlockedDomain({
      domain: domain.toLowerCase(),
      reason,
      addedBy: req.user._id
    });

    await blockedDomain.save();

    // Create audit log
    await createAuditLog(req.auditInfo, {
      details: {
        domain: domain.toLowerCase(),
        reason
      }
    });

    res.status(201).json({
      success: true,
      message: 'Domain blocked successfully',
      data: blockedDomain
    });
  } catch (error) {
    console.error('Add blocked domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block domain'
    });
  }
};

/**
 * Remove Blocked Domain
 */
const removeBlockedDomain = async (req, res) => {
  try {
    const { domainId } = req.params;

    const domain = await BlockedDomain.findByIdAndUpdate(
      domainId,
      { isActive: false },
      { new: true }
    );

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: 'Blocked domain not found'
      });
    }

    // Create audit log
    await createAuditLog(req.auditInfo, {
      details: {
        domain: domain.domain,
        action: 'unblocked'
      }
    });

    res.json({
      success: true,
      message: 'Domain unblocked successfully'
    });
  } catch (error) {
    console.error('Remove blocked domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock domain'
    });
  }
};

/**
 * Get Reports (Weekly/Final)
 */
const getReports = async (req, res) => {
  try {
    const {
      type = 'weekly',
      page = 1,
      limit = 10,
      studentId = '',
      status = ''
    } = req.query;

    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let reports, total;

    if (type === 'weekly') {
      [reports, total] = await Promise.all([
        WeeklyReport.find(filter)
          .populate('studentId', 'name email rollNumber')
          .populate('supervisorId', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        WeeklyReport.countDocuments(filter)
      ]);
    } else {
      [reports, total] = await Promise.all([
        InternshipReport.find(filter)
          .populate('studentId', 'name email rollNumber')
          .populate('companyId', 'companyName')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        InternshipReport.countDocuments(filter)
      ]);
    }

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
};

/**
 * Get Misconduct Reports
 */
const getMisconductReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      reportedBy = ''
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (reportedBy) filter.reportedBy = reportedBy;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      MisconductReport.find(filter)
        .populate('reportedBy', 'name email role')
        .populate('reportedUser', 'name email role')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MisconductReport.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get misconduct reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch misconduct reports'
    });
  }
};

/**
 * Resolve Misconduct Report
 */
const resolveMisconductReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { resolution, actionTaken } = req.body;

    const report = await MisconductReport.findByIdAndUpdate(
      reportId,
      {
        status: 'resolved',
        resolution,
        actionTaken,
        resolvedBy: req.user._id,
        resolvedAt: new Date()
      },
      { new: true }
    ).populate('reportedBy', 'name email')
     .populate('reportedUser', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Misconduct report not found'
      });
    }

    // Create audit log
    await createAuditLog(req.auditInfo, {
      details: {
        reportId,
        resolution,
        actionTaken,
        reportType: report.type
      }
    });

    res.json({
      success: true,
      message: 'Misconduct report resolved successfully',
      data: report
    });
  } catch (error) {
    console.error('Resolve misconduct report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve misconduct report'
    });
  }
};

/**
 * Send Broadcast Email
 */
const sendBroadcast = async (req, res) => {
  try {
    const { recipients, subject, message, type } = req.body;

    // Validate recipients
    const validRecipients = ['all', 'students', 'companies', 'supervisors'];
    if (!validRecipients.includes(recipients)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipients specified'
      });
    }

    // Send broadcast email (implementation in utils)
    const result = await sendBroadcastEmail({
      recipients,
      subject,
      message,
      type,
      sentBy: req.user._id
    });

    // Create audit log
    await createAuditLog(req.auditInfo, {
      details: {
        recipients,
        subject,
        emailsSent: result.sent,
        emailsFailed: result.failed
      }
    });

    res.json({
      success: true,
      message: 'Broadcast email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Send broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast email'
    });
  }
};

/**
 * Generate Certificate PDF
 */
const generateCertificate = async (req, res) => {
  try {
    const { studentId, internshipId } = req.params;
    const { template } = req.body;

    // Generate certificate PDF (implementation in utils)
    const pdfBuffer = await generateCertificatePDF({
      studentId,
      internshipId,
      template: template || 'default',
      generatedBy: req.user._id
    });

    // Create audit log
    await createAuditLog(req.auditInfo, {
      details: {
        studentId,
        internshipId,
        template: template || 'default'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${studentId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate'
    });
  }
};

module.exports = {
  getSettings,
  updateSetting,
  getBlockedDomains,
  addBlockedDomain,
  removeBlockedDomain,
  getReports,
  getMisconductReports,
  resolveMisconductReport,
  sendBroadcast,
  generateCertificate
};