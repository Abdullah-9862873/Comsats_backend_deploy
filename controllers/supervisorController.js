const User = require('../models/User');
const { syncSupervisorStudentCounts, getSupervisorAvailability } = require('../utils/supervisorUtils');
const WeeklyReport = require('../models/WeeklyReport');
const SupervisorEvaluation = require('../models/SupervisorEvaluation');
const SupervisionRequest = require('../models/SupervisionRequest');
const Application = require('../models/Application');
const SupervisorChat = require('../models/SupervisorChat');
const ProgressReport = require('../models/ProgressReport');
const InternshipAppraisal = require('../models/InternshipAppraisal');
const MisconductReport = require('../models/MisconductReport');
const Student = require('../models/Student');

// @desc    Get supervisor profile
// @route   GET /api/supervisors/profile
// @access  Private (Supervisor only)
const getSupervisorProfile = async (req, res) => {
  try {
    const supervisor = await User.findById(req.user.id).select('-password');
    
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: supervisor
    });

  } catch (error) {
    console.error('Error fetching supervisor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: error.message
    });
  }
};

// @desc    Update supervisor profile
// @route   PUT /api/supervisors/profile
// @access  Private (Supervisor only)
const updateSupervisorProfile = async (req, res) => {
  try {
    const { 
      phone, 
      office, 
      officeHours, 
      maxStudents, 
      expertise 
    } = req.body;

    // Get current supervisor to check student count
    const currentSupervisor = await User.findById(req.user.id);
    const currentStudents = currentSupervisor.supervisor?.currentStudents || 0;
    
    // Validate that new maxStudents is not less than current students
    if (maxStudents && maxStudents < currentStudents) {
      return res.status(400).json({
        success: false,
        message: `Cannot set student limit to ${maxStudents}. You currently have ${currentStudents} assigned students. Please set a limit of at least ${currentStudents}.`
      });
    }

    // Update supervisor profile (excluding name, email, department, and designation)
    const updatedSupervisor = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'supervisor.phone': phone,
          'supervisor.office': office,
          'supervisor.officeHours': officeHours,
          'supervisor.maxStudents': maxStudents || 10,
          'supervisor.expertise': expertise || []
        }
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!updatedSupervisor) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    console.log(`✅ Supervisor profile updated: ${updatedSupervisor.name} (limit: ${maxStudents || 10})`);

    res.status(200).json({
      success: true,
      data: updatedSupervisor,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating supervisor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
};

// @desc    Get all supervisors (for students)
// @route   GET /api/supervisors
// @access  Private
const getAllSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({
      role: 'supervisor'
    }).select('name email supervisor');

    // Transform the data to match frontend expectations
    const transformedSupervisors = await Promise.all(supervisors.map(async supervisor => {
      // Get real-time availability status
      const availability = await getSupervisorAvailability(supervisor._id);
      
      return {
        _id: supervisor._id,
        id: supervisor._id, // For compatibility
        name: supervisor.name,
        email: supervisor.email,
        department: supervisor.supervisor?.department || 'Not specified',
        designation: supervisor.supervisor?.designation || 'Supervisor',
        maxStudents: supervisor.supervisor?.maxStudents || 10,
        currentStudents: availability.currentStudents, // Use real-time count
        expertise: supervisor.supervisor?.expertise || ['Machine Learning', 'Data Science'], // Default expertise
        phone: supervisor.supervisor?.phone || '+92-XXX-XXXXXXX',
        office: supervisor.supervisor?.office || 'Office not specified',
        officeHours: supervisor.supervisor?.officeHours || 'Mon-Fri, 9AM-5PM',
        assignedStudents: supervisor.supervisor?.assignedStudents || [],
        isAvailable: availability.available,
        availableSlots: availability.availableSlots,
        utilizationPercentage: availability.utilizationPercentage
      };
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

// @desc    Sync supervisor student counts
// @route   POST /api/supervisors/sync-counts
// @access  Private (Admin only)
const syncStudentCounts = async (req, res) => {
  try {
    console.log('🔄 Manual supervisor count sync requested');
    const result = await syncSupervisorStudentCounts();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to sync supervisor counts',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while syncing counts',
      error: error.message
    });
  }
};

// @desc    Get supervisor dashboard statistics
// @route   GET /api/supervisors/dashboard-stats
// @access  Private (Supervisor only)
const getDashboardStats = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    // Get supervisor info
    const supervisor = await User.findById(supervisorId).select('name email supervisor');
    if (!supervisor || supervisor.role !== 'supervisor') {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found'
      });
    }

    // Get all students supervised by this supervisor
    // Find all students where their User record has supervisorId matching this supervisor
    const studentUsers = await User.find({ 
      role: 'student',
      'student.supervisorId': supervisorId
    }).select('_id email name');

    const studentEmails = studentUsers.map(u => u.email);
    
    // Get Student profiles for these users
    const students = await Student.find({
      email: { $in: studentEmails }
    }).select('_id email rollNumber name internshipStatus');

    const studentIds = students.map(s => s._id);

    // Count all reports submitted by students (Progress Reports)
    const totalProgressReports = await ProgressReport.countDocuments({ 
      studentId: { $in: studentIds }
    });

    const pendingProgressReports = await ProgressReport.countDocuments({ 
      studentId: { $in: studentIds },
      status: { $in: ['pending', 'submitted'] }
    });

    const reviewedProgressReports = await ProgressReport.countDocuments({ 
      studentId: { $in: studentIds },
      status: { $in: ['reviewed', 'approved'] }
    });

    // Count Internship Appraisals
    const totalAppraisals = await InternshipAppraisal.countDocuments({ 
      studentId: { $in: studentIds }
    });

    const pendingAppraisals = await InternshipAppraisal.countDocuments({ 
      studentId: { $in: studentIds },
      status: { $in: ['pending', 'submitted'] }
    });

    const reviewedAppraisals = await InternshipAppraisal.countDocuments({ 
      studentId: { $in: studentIds },
      status: { $in: ['reviewed', 'approved'] }
    });

    // Count Misconduct Reports
    const totalMisconductReports = await MisconductReport.countDocuments({ 
      studentId: { $in: studentIds }
    });

    const pendingMisconductReports = await MisconductReport.countDocuments({ 
      studentId: { $in: studentIds },
      status: { $in: ['pending', 'submitted'] }
    });

    const reviewedMisconductReports = await MisconductReport.countDocuments({ 
      studentId: { $in: studentIds },
      status: { $in: ['reviewed', 'resolved'] }
    });

    // Total student reports = Progress + Appraisals + Misconduct
    const totalReports = totalProgressReports + totalAppraisals + totalMisconductReports;
    const pendingReports = pendingProgressReports + pendingAppraisals + pendingMisconductReports;
    const reviewedReports = reviewedProgressReports + reviewedAppraisals + reviewedMisconductReports;

    // Count evaluations submitted BY supervisor
    const totalEvaluations = await SupervisorEvaluation.countDocuments({ 
      supervisorId: supervisorId 
    });

    const completedEvaluations = await SupervisorEvaluation.countDocuments({ 
      supervisorId: supervisorId,
      status: 'submitted'
    });

    const pendingEvaluations = await SupervisorEvaluation.countDocuments({ 
      supervisorId: supervisorId,
      status: { $in: ['pending', 'draft'] }
    });

    // Count supervision requests
    const supervisionRequests = await SupervisionRequest.countDocuments({
      supervisorId: supervisorId,
      status: 'pending'
    });

    // Count job applications waiting for supervisor approval
    const jobApplications = await Application.countDocuments({
      supervisorId: supervisorId,
      supervisorStatus: 'pending'
    });

    // Count unread messages (if chat exists)
    let unreadMessages = 0;
    try {
      unreadMessages = await SupervisorChat.countDocuments({
        supervisorId: supervisorId,
        'messages.sender': { $ne: supervisorId },
        'messages.read': false
      });
    } catch (e) {
      // Chat may not be implemented yet
      unreadMessages = 0;
    }

    // Get recent activity from all report types
    const recentProgressReports = await ProgressReport.find({
      studentId: { $in: studentIds }
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('studentId', 'name rollNumber email');

    const recentAppraisals = await InternshipAppraisal.find({
      studentId: { $in: studentIds }
    })
    .sort({ createdAt: -1 })
    .limit(2)
    .populate('studentId', 'name rollNumber email');

    const recentMisconduct = await MisconductReport.find({
      studentId: { $in: studentIds }
    })
    .sort({ createdAt: -1 })
    .limit(2)
    .populate('studentId', 'name rollNumber email');

    // Combine and sort all recent activities
    const allRecentActivities = [
      ...recentProgressReports.map(r => ({
        type: 'progress_report',
        title: 'Progress Report Submitted',
        description: `${r.studentId?.name || 'Student'} submitted a progress report`,
        date: r.createdAt,
        status: r.status
      })),
      ...recentAppraisals.map(a => ({
        type: 'appraisal',
        title: 'Internship Appraisal Submitted',
        description: `${a.studentId?.name || 'Student'} submitted an internship appraisal`,
        date: a.createdAt,
        status: a.status
      })),
      ...recentMisconduct.map(m => ({
        type: 'misconduct',
        title: 'Misconduct Report Submitted',
        description: `${m.studentId?.name || 'Student'} filed a misconduct report`,
        date: m.createdAt,
        status: m.status
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    // Calculate student status counts
    const activeStudents = students.filter(s => 
      s.internshipStatus === 'active' || s.internshipStatus === 'ongoing'
    ).length;
    
    const completedStudents = students.filter(s => 
      s.internshipStatus === 'completed'
    ).length;

    const inProgressStudents = students.length - activeStudents - completedStudents;

    const statsData = {
      profile: {
        name: supervisor.name,
        email: supervisor.email,
        department: supervisor.supervisor?.department || 'Not specified',
        maxStudents: supervisor.supervisor?.maxStudents || 10,
        currentStudents: students.length
      },
      studentsCount: students.length,
      activeStudents: activeStudents,
      completedStudents: completedStudents,
      inProgressStudents: inProgressStudents,
      reportsCount: {
        pending: pendingReports,
        reviewed: reviewedReports,
        total: totalReports
      },
      evaluationsCount: {
        pending: pendingEvaluations,
        completed: completedEvaluations,
        total: totalEvaluations
      },
      supervisionRequests: supervisionRequests,
      jobApplications: jobApplications,
      unreadMessages: unreadMessages,
      recentActivity: allRecentActivities
    };

    res.status(200).json({
      success: true,
      data: statsData
    });

  } catch (error) {
    console.error('Error fetching supervisor dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  getSupervisorProfile,
  updateSupervisorProfile,
  getAllSupervisors,
  syncStudentCounts,
  getDashboardStats
};
