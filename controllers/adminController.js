const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const WeeklyReport = require('../models/WeeklyReport');
const MisconductReport = require('../models/MisconductReport');
const Setting = require('../models/Setting');
const BlockedDomain = require('../models/BlockedDomain');
const AuditLog = require('../models/AuditLog');
const { createAuditLog } = require('../middleware/adminAuth');
const { validationResult } = require('express-validator');

/**
 * Get Dashboard Statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalCompanies,
      totalSupervisors,
      activeJobs,
      pendingApplications,
      pendingCompanies,
      totalReports,
      recentAuditLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'company' }),
      User.countDocuments({ role: 'supervisor' }),
      Job.countDocuments({ status: 'Active' }), // Use capitalized 'Active' to match your data
      Application.countDocuments({ status: 'pending' }),
      CompanyProfile.countDocuments({ status: 'pending' }),
      WeeklyReport.countDocuments(),
      AuditLog.find()
        .populate('adminUserId', 'name email')
        .sort({ timestamp: -1 })
        .limit(10)
    ]);

    const stats = {
      users: {
        total: totalUsers,
        students: totalStudents,
        companies: totalCompanies,
        supervisors: totalSupervisors
      },
      jobs: {
        active: activeJobs
      },
      applications: {
        pending: pendingApplications
      },
      companies: {
        pending: pendingCompanies
      },
      reports: {
        total: totalReports
      },
      recentActivity: recentAuditLogs
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

/**
 * Get Users with Pagination and Filtering
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute queries
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Get User Details
 */
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is a company, fetch company profile
    if (user.role === 'company') {
      const CompanyProfile = require('../models/CompanyProfile');
      const companyProfile = await CompanyProfile.findOne({ user: userId }).lean();
      if (companyProfile) {
        user.companyProfile = companyProfile;
      }
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

/**
 * Update User Role/Status
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, status, name, student, supervisor, companyProfile } = req.body;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store old values for audit
    const oldValues = {
      name: user.name,
      role: user.role,
      status: user.status,
      student: user.student,
      supervisor: user.supervisor
    };

    // Update user data
    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    // Handle role-specific data
    if (student && role === 'student') {
      updateData.student = {
        department: student.department || user.student?.department,
        semester: student.semester || user.student?.semester,
        regNo: student.regNo || user.student?.regNo
      };
    }
    
    if (supervisor && role === 'supervisor') {
      updateData.supervisor = {
        department: supervisor.department || user.supervisor?.department,
        designation: supervisor.designation || user.supervisor?.designation
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    // Handle company profile updates
    if (companyProfile && (role === 'company' || user.role === 'company')) {
      const CompanyProfile = require('../models/CompanyProfile');
      
      const companyUpdateData = {};
      if (companyProfile.companyName) companyUpdateData.companyName = companyProfile.companyName;
      if (companyProfile.industry) companyUpdateData.industry = companyProfile.industry;
      
      if (Object.keys(companyUpdateData).length > 0) {
        await CompanyProfile.findOneAndUpdate(
          { user: userId },
          companyUpdateData,
          { new: true }
        );
      }
    }

    // Create audit log
    await createAuditLog(req.auditInfo, {
      targetUserId: userId,
      details: {
        oldValues,
        newValues: updateData,
        targetUserEmail: user.email
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

/**
 * Update User Status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent changing admin status
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change admin user status'
      });
    }

    // Store old values for audit
    const oldStatus = user.status;

    // Update user status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, select: '-password' }
    );

    // Create audit log
    await createAuditLog(req.auditInfo, {
      targetUserId: userId,
      details: {
        oldStatus,
        newStatus: status,
        targetUserEmail: user.email
      }
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

/**
 * Mark Inactive Users
 */
const markInactiveUsers = async (req, res) => {
  try {
    const { days = 90 } = req.body; // Default to 90 days
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Find users who haven't logged in for the specified period
    const inactiveUsers = await User.find({
      $and: [
        { role: { $ne: 'admin' } }, // Don't mark admins as inactive
        { status: { $ne: 'inactive' } }, // Don't process already inactive users
        {
          $or: [
            { lastLogin: { $lt: cutoffDate } },
            { 
              lastLogin: null,
              createdAt: { $lt: cutoffDate }
            }
          ]
        }
      ]
    }).select('name email role lastLogin createdAt');
    
    if (inactiveUsers.length === 0) {
      return res.json({
        success: true,
        message: 'No users found that need to be marked as inactive',
        data: {
          affectedUsers: 0,
          users: []
        }
      });
    }
    
    // Mark users as inactive
    const result = await User.updateMany(
      { _id: { $in: inactiveUsers.map(u => u._id) } },
      { 
        status: 'inactive',
        lastActivity: new Date()
      }
    );
    
    // Create audit log
    await createAuditLog(req.auditInfo, {
      details: {
        action: 'BULK_MARK_INACTIVE',
        period: `${days} days`,
        affectedUsers: result.modifiedCount,
        userIds: inactiveUsers.map(u => u._id)
      }
    });
    
    res.json({
      success: true,
      message: `Successfully marked ${result.modifiedCount} users as inactive`,
      data: {
        affectedUsers: result.modifiedCount,
        period: days,
        cutoffDate,
        users: inactiveUsers
      }
    });
  } catch (error) {
    console.error('Mark inactive users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark users as inactive',
      error: error.message
    });
  }
};

/**
 * Get Companies for Approval
 */
const getCompanies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      type
    } = req.query;

    console.log('📊 Get companies request params:', req.query);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = {};
    
    // Handle status filter
    if (status && status !== '') {
      filter.status = status;
    }
    
    // Handle search filter
    if (search && search !== '') {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        // Note: Cannot directly search populated fields, need to use aggregation for that
      ];
    }
    
    // Handle type filter (if you have company types)
    if (type && type !== '') {
      filter.companyType = type;
    }

    console.log('📊 Company filter:', filter);

    const [companies, total] = await Promise.all([
      CompanyProfile.find(filter)
        .populate('user', 'name email createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CompanyProfile.countDocuments(filter)
    ]);

    console.log('📊 Found companies:', companies.length, 'Total:', total);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    });
  }
};

/**
 * Approve/Reject Company
 */
const updateCompanyStatus = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status, rejectionReason } = req.body;

    const company = await CompanyProfile.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const updateData = { status };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedCompany = await CompanyProfile.findByIdAndUpdate(
      companyId,
      updateData,
      { new: true }
    ).populate('user', 'name email');

    // Create audit log
    await createAuditLog(req.auditInfo, {
      targetCompanyId: companyId,
      details: {
        newStatus: status,
        rejectionReason: rejectionReason || null,
        companyName: company.companyName
      }
    });

    res.json({
      success: true,
      message: `Company ${status} successfully`,
      data: updatedCompany
    });
  } catch (error) {
    console.error('Update company status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company status'
    });
  }
};

/**
 * Approve Company
 */
const approveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;

    const company = await CompanyProfile.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const updatedCompany = await CompanyProfile.findByIdAndUpdate(
      companyId,
      { status: 'approved' },
      { new: true }
    ).populate('user', 'name email');

    // Create audit log
    await createAuditLog(req.auditInfo, {
      targetCompanyId: companyId,
      details: {
        action: 'approve',
        reason: reason || null,
        companyName: company.companyName
      }
    });

    res.json({
      success: true,
      message: 'Company approved successfully',
      data: updatedCompany
    });
  } catch (error) {
    console.error('Approve company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve company'
    });
  }
};

/**
 * Reject Company
 */
const rejectCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;

    const company = await CompanyProfile.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const updateData = { status: 'rejected' };
    if (reason) {
      updateData.rejectionReason = reason;
    }

    const updatedCompany = await CompanyProfile.findByIdAndUpdate(
      companyId,
      updateData,
      { new: true }
    ).populate('user', 'name email');

    // Create audit log
    await createAuditLog(req.auditInfo, {
      targetCompanyId: companyId,
      details: {
        action: 'reject',
        reason: reason || null,
        companyName: company.companyName
      }
    });

    res.json({
      success: true,
      message: 'Company rejected successfully',
      data: updatedCompany
    });
  } catch (error) {
    console.error('Reject company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject company'
    });
  }
};

/**
 * Get Single Company Details
 */
const getCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await CompanyProfile.findById(companyId)
      .populate('user', 'name email createdAt isVerified');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Get company details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company details'
    });
  }
};

/**
 * Get Applications with Filtering
 */
const getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      studentId = '',
      companyId = ''
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (studentId) filter.studentId = studentId;
    if (companyId) filter.companyId = companyId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('studentId', 'name email')
        .populate('companyId', 'companyName')
        .populate('jobId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Application.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

/**
 * Update Application Status
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const oldStatus = application.status;
    const updateData = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;

    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      updateData,
      { new: true }
    ).populate('studentId', 'name email')
     .populate('companyId', 'companyName');

    // Create audit log
    await createAuditLog(req.auditInfo, {
      targetApplicationId: applicationId,
      details: {
        oldStatus,
        newStatus: status,
        adminNotes: adminNotes || null
      }
    });

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status'
    });
  }
};

/**
 * Get Audit Logs
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action = '',
      adminUserId = ''
    } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (adminUserId) filter.adminUserId = adminUserId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('adminUserId', 'name email')
        .populate('targetUserId', 'name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
};

/**
 * Get Jobs with Filtering for Admin
 */
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      type,
      location
    } = req.query;

    console.log('📊 Get jobs request params:', req.query);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = {};
    
    // Handle status filter
    if (status && status !== '') {
      filter.status = status;
    }
    
    // Handle search filter
    if (search && search !== '') {
      filter.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { jobDescription: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Handle type filter
    if (type && type !== '') {
      filter.workType = type;
    }

    // Handle location filter
    if (location && location !== '') {
      filter.workType = location; // Map location filter to workType field
    }

    console.log('📊 Job filter:', filter);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate({
          path: 'companyId',
          select: 'name email role company',
          populate: {
            path: 'company',
            model: 'CompanyProfile',
            select: 'companyName industry about website'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(filter)
    ]);

    console.log('📊 Found jobs:', jobs.length, 'Total:', total);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};

/**
 * Get Job Details (Admin)
 */
const getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Fetch job details with company information
    const job = await Job.findById(jobId)
      .populate('companyId', 'companyName email website industry about')
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Fetch applications for this job
    const applications = await Application.find({ jobId: jobId })
      .select('status createdAt')
      .lean();

    // Count applications by status
    const applicationStats = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    // Prepare response data
    const jobDetails = {
      ...job,
      applications: applications,
      applicationStats: {
        total: applications.length,
        pending: applicationStats.pending || 0,
        shortlisted: applicationStats.shortlisted || 0,
        accepted: applicationStats.accepted || 0,
        rejected: applicationStats.rejected || 0
      }
    };

    res.json({
      success: true,
      data: jobDetails
    });
  } catch (error) {
    console.error('Get job details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job details',
      error: error.message
    });
  }
};

/**
 * Update Job (Admin)
 */
const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const updateData = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Update job with new data
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true, runValidators: true }
    ).populate('companyId', 'companyName email');

    // Create audit log
    await createAuditLog(req.auditInfo, {
      targetJobId: jobId,
      details: {
        action: 'update',
        changes: updateData,
        jobTitle: job.jobTitle
      }
    });

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
};

/**
 * Update Job Status (Admin)
 */
const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, reason } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Map lowercase status to capitalized status for the database
    const statusMap = {
      'active': 'Active',
      'pending': 'Inactive',
      'closed': 'Closed',
      'draft': 'Draft'
    };

    const dbStatus = statusMap[status.toLowerCase()] || status;
    const updateData = { status: dbStatus };
    
    if (status === 'closed' && reason) {
      updateData.adminNotes = reason;
    }

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      updateData,
      { new: true }
    ).populate('companyId', 'companyName email');

    // Create audit log
    await createAuditLog(req.auditInfo, {
      targetJobId: jobId,
      details: {
        newStatus: dbStatus,
        reason: reason || null,
        jobTitle: job.jobTitle
      }
    });

    res.json({
      success: true,
      message: `Job ${status} successfully`,
      data: updatedJob
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job status'
    });
  }
};

/**
 * Delete Job (Admin)
 */
const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await Job.findByIdAndDelete(jobId);

    // Create audit log
    await createAuditLog(req.auditInfo, {
      targetJobId: jobId,
      details: {
        action: 'delete',
        jobTitle: job.jobTitle,
        companyId: job.companyId
      }
    });

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job'
    });
  }
};

/**
 * Get Analytics Data for Reports
 */
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // Create date range filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get basic statistics
    const [
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      activeInternships,
      completedInternships
    ] = await Promise.all([
      User.countDocuments(dateFilter),
      CompanyProfile.countDocuments(dateFilter),
      Job.countDocuments(dateFilter),
      Application.countDocuments(dateFilter),
      Application.countDocuments({ 
        ...dateFilter, 
        status: { $in: ['hired', 'accepted'] } 
      }),
      Application.countDocuments({ 
        ...dateFilter, 
        status: 'completed' 
      })
    ]);

    // Get chart data based on type
    let chartData = {};
    
    if (type === 'overview' || !type) {
      // Monthly statistics for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const monthlyStats = await Application.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      chartData.monthlyStats = monthlyStats;
    }

    // Applications by status
    const applicationsChart = await Application.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Companies by status
    const companiesChart = await CompanyProfile.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    chartData.applicationsChart = applicationsChart;
    chartData.companiesChart = companiesChart;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        activeInternships,
        completedInternships
      },
      chartData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
};

/**
 * Generate Report (placeholder for Excel/PDF generation)
 */
const generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;
    
    // Create audit log
    await createAuditLog(req.user.id, 'report_generated', {
      details: {
        reportType: type,
        startDate,
        endDate
      }
    });

    // For now, return a simple response
    // In a real implementation, you would generate Excel/PDF files
    res.json({
      success: true,
      message: `${type} report generated successfully`,
      downloadUrl: `/api/admin/reports/download/${type}_${Date.now()}.xlsx`
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
};

/**
 * Get System Settings
 */
const getSettings = async (req, res) => {
  try {
    // Get all settings from database
    const settings = await Setting.find({});
    
    // Convert array to object with key-value pairs
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    // Provide default values for missing settings
    const defaultSettings = {
      systemName: 'Internship Portal',
      systemEmail: 'admin@internshipportal.com',
      systemUrl: 'http://localhost:3000',
      maintenanceMode: false,
      registrationEnabled: true,
      emailProvider: 'smtp',
      smtpHost: '',
      smtpPort: '587',
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: true,
      emailFromName: '',
      emailFromAddress: '',
      emailNotifications: true,
      applicationNotifications: true,
      systemAlerts: true,
      marketingEmails: false,
      passwordMinLength: 8,
      requireSpecialChar: true,
      requireNumbers: true,
      sessionTimeout: 24,
      twoFactorAuth: false,
      maxLoginAttempts: 5,
      maxApplicationsPerUser: 5,
      applicationDeadlineReminder: 7,
      autoApproveCompanies: false,
      requireEmailVerification: true,
      theme: 'light',
      primaryColor: '#3B82F6',
      enableDarkMode: true,
      compactMode: false
    };

    const finalSettings = { ...defaultSettings, ...settingsObj };

    res.json({
      success: true,
      settings: finalSettings
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
 * Update System Settings
 */
const updateSettings = async (req, res) => {
  try {
    const settingsData = req.body;
    
    // Update each setting in the database
    const updatePromises = Object.entries(settingsData).map(async ([key, value]) => {
      await Setting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updatePromises);

    // Create audit log
    await createAuditLog({
      action: 'SETTINGS_UPDATED',
      adminUserId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }, {
      details: {
        settingsUpdated: Object.keys(settingsData).length
      }
    });

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

/**
 * Reset Settings to Default
 */
const resetSettings = async (req, res) => {
  try {
    // Delete all settings to restore defaults
    await Setting.deleteMany({});

    // Create audit log
    await createAuditLog({
      action: 'SETTINGS_RESET',
      adminUserId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }, {
      details: {
        action: 'reset_to_defaults'
      }
    });

    // Return default settings
    const defaultSettings = {
      systemName: 'Internship Portal',
      systemEmail: 'admin@internshipportal.com',
      systemUrl: 'http://localhost:3000',
      maintenanceMode: false,
      registrationEnabled: true,
      emailProvider: 'smtp',
      smtpHost: '',
      smtpPort: '587',
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: true,
      emailFromName: '',
      emailFromAddress: '',
      emailNotifications: true,
      applicationNotifications: true,
      systemAlerts: true,
      marketingEmails: false,
      passwordMinLength: 8,
      requireSpecialChar: true,
      requireNumbers: true,
      sessionTimeout: 24,
      twoFactorAuth: false,
      maxLoginAttempts: 5,
      maxApplicationsPerUser: 5,
      applicationDeadlineReminder: 7,
      autoApproveCompanies: false,
      requireEmailVerification: true,
      theme: 'light',
      primaryColor: '#3B82F6',
      enableDarkMode: true,
      compactMode: false
    };

    res.json({
      success: true,
      message: 'Settings reset to default values',
      settings: defaultSettings
    });

  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings'
    });
  }
};

/**
 * Send Notification to Users
 */
const sendNotificationToUser = async (req, res) => {
  try {
    const { recipients, specificUserIds, userType, subject, message } = req.body;
    
    if (!subject || !message || !userType) {
      return res.status(400).json({
        success: false,
        message: 'User type, subject, and message are required'
      });
    }

    let userFilter = {};
    
    if (recipients === 'specific' && specificUserIds && specificUserIds.length > 0) {
      // Send to specific users
      userFilter = { _id: { $in: specificUserIds } };
    } else {
      // Send to all users of specific type
      userFilter = { role: userType };
    }

    // Get target users
    const targetUsers = await User.find(userFilter).select('email name role');
    
    if (targetUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found for the specified criteria'
      });
    }

    // Create audit log
    await createAuditLog(req.user.id, 'NOTIFICATION_SENT', {
      userType,
      recipients: recipients === 'specific' ? 'specific users' : `all ${userType}s`,
      subject,
      userCount: targetUsers.length,
      specificUserIds: recipients === 'specific' ? specificUserIds : undefined
    });

    // For now, we'll just log the notification (you can integrate with email service later)
    console.log(`Admin ${req.user.email} sent notification to ${targetUsers.length} users:`, {
      subject,
      message,
      recipients: targetUsers.map(user => ({ email: user.email, name: user.name, role: user.role }))
    });

    // TODO: Integrate with actual email service (nodemailer, sendgrid, etc.)
    // For now, simulate successful sending
    const emailResults = targetUsers.map(user => ({
      email: user.email,
      name: user.name,
      status: 'sent'
    }));

    res.json({
      success: true,
      message: `Notification sent successfully to ${targetUsers.length} users`,
      data: {
        totalSent: targetUsers.length,
        results: emailResults
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

/**
 * Export Users Data
 */
const exportUsers = async (req, res) => {
  try {
    const { format = 'csv', role, status } = req.query;
    
    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    // Get users data
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    // Create audit log
    await createAuditLog(req.user.id, 'USERS_EXPORTED', {
      format,
      userCount: users.length,
      filters: { role, status }
    });

    if (format.toLowerCase() === 'csv') {
      // Generate CSV
      const csvData = users.map(user => ({
        ID: user._id,
        Name: user.name || 'N/A',
        Email: user.email,
        Role: user.role,
        Status: user.status || 'active',
        'Email Verified': user.isVerified ? 'Yes' : 'No',
        'Created Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
        'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0] || {});
      const csvRows = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];
      
      const csvString = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvString);
      
    } else if (format.toLowerCase() === 'excel') {
      // For Excel format, we'll send JSON that frontend can convert
      const excelData = users.map(user => ({
        'User ID': user._id,
        'Full Name': user.name || 'N/A',
        'Email Address': user.email,
        'User Role': user.role,
        'Account Status': user.status || 'active',
        'Email Verified': user.isVerified ? 'Yes' : 'No',
        'Registration Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
        'Last Login Date': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
        'Profile Complete': user.profileComplete ? 'Yes' : 'No'
      }));

      res.json({
        success: true,
        data: excelData,
        filename: `users-export-${new Date().toISOString().split('T')[0]}.xlsx`
      });
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, excel'
      });
    }

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUserRole,
  updateUserStatus,
  markInactiveUsers,
  getCompanies,
  updateCompanyStatus,
  approveCompany,
  rejectCompany,
  getCompanyDetails,
  getApplications,
  updateApplicationStatus,
  getAuditLogs,
  getJobs,
  getJobDetails,
  updateJob,
  updateJobStatus,
  deleteJob,
  getAnalytics,
  generateReport,
  getSettings,
  updateSettings,
  resetSettings,
  sendNotificationToUser,
  exportUsers
};