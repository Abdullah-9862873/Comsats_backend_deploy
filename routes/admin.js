const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Application = require('../models/Application');
const InterneeEvaluation = require('../models/InterneeEvaluation');
const SupervisionRequest = require('../models/SupervisionRequest');
const { auth, isAdmin } = require('../middleware/auth');

// Admin middleware - require admin role for all routes
router.use(auth);
router.use(isAdmin);

// ==================== USER MANAGEMENT ====================

// Get all users with filtering and pagination
router.get('/users', async (req, res) => {
  try {
    const { 
      role, 
      page = 1, 
      limit = 10, 
      search, 
      status,
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

    // Get paginated results
    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user by ID with detailed information
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get additional data based on user role
    let additionalData = {};
    
    if (user.role === 'student') {
      const studentProfile = await Student.findOne({ rollNumber: user.rollNumber });
      const applications = await Application.find({ rollNumber: user.rollNumber })
        .populate('companyId', 'name')
        .sort({ createdAt: -1 });
      
      additionalData = {
        profile: studentProfile,
        applications,
        applicationCount: applications.length
      };
    } else if (user.role === 'company') {
      const jobs = await Application.find({ companyId: userId }).distinct('jobTitle');
      const applications = await Application.find({ companyId: userId })
        .populate('rollNumber', 'name')
        .sort({ createdAt: -1 });
      
      additionalData = {
        jobsPosted: jobs.length,
        applications,
        applicationCount: applications.length
      };
    } else if (user.role === 'supervisor') {
      const supervisionRequests = await SupervisionRequest.find({ supervisorId: userId })
        .populate('studentId', 'name rollNumber')
        .sort({ createdAt: -1 });
      
      const evaluations = await InterneeEvaluation.find({ supervisorId: userId })
        .populate('studentId', 'name rollNumber')
        .sort({ createdAt: -1 });

      additionalData = {
        supervisionRequests,
        evaluations,
        studentsSupervised: supervisionRequests.filter(r => r.status === 'accepted').length
      };
    }

    res.json({
      success: true,
      data: {
        user,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user information (admin override)
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData._id;
    delete updateData.__v;

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete admin users' 
      });
    }

    // Delete user and related data
    await User.findByIdAndDelete(userId);
    
    // Clean up related data based on user role
    if (user.role === 'student') {
      await Student.deleteOne({ rollNumber: user.rollNumber });
      await Application.deleteMany({ rollNumber: user.rollNumber });
      await SupervisionRequest.deleteMany({ studentId: userId });
    } else if (user.role === 'company') {
      await Application.deleteMany({ companyId: userId });
    } else if (user.role === 'supervisor') {
      await SupervisionRequest.updateMany(
        { supervisorId: userId },
        { status: 'cancelled', supervisorId: null }
      );
      await InterneeEvaluation.deleteMany({ supervisorId: userId });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk update users
router.patch('/users/bulk', async (req, res) => {
  try {
    const { userIds, updateData } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User IDs array is required' 
      });
    }

    // Remove sensitive fields
    delete updateData.password;
    delete updateData._id;
    delete updateData.__v;

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { ...updateData, updatedAt: new Date() }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users`,
      data: result
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== COMPANY MANAGEMENT ====================

const {
  getCompanies,
  updateCompanyStatus,
  approveCompany,
  rejectCompany,
  getCompanyDetails
} = require('../controllers/adminController');

// Get all companies with filtering and pagination
router.get('/companies', getCompanies);

// Get single company details
router.get('/companies/:companyId', getCompanyDetails);

// Approve company
router.post('/companies/:companyId/approve', approveCompany);

// Reject company
router.post('/companies/:companyId/reject', rejectCompany);

// Update company status (general)
router.patch('/companies/:companyId/status', updateCompanyStatus);

// ==================== STUDENTS MANAGEMENT ====================

// Get all students with profiles
router.get('/students', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      department,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter for users with student role
    const userFilter = { role: 'student' };
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Get students with populated profile data
    const skip = (page - 1) * limit;
    const students = await User.find(userFilter)
      .select('-password')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get student profiles and application counts
    const studentsWithProfiles = await Promise.all(
      students.map(async (student) => {
        const profile = await Student.findOne({ rollNumber: student.rollNumber });
        const applicationCount = await Application.countDocuments({ 
          rollNumber: student.rollNumber 
        });
        
        return {
          ...student,
          profile,
          applicationCount
        };
      })
    );

    const total = await User.countDocuments(userFilter);

    res.json({
      success: true,
      data: {
        students: studentsWithProfiles,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get student profile with applications
router.get('/students/:studentId/profile', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const profile = await Student.findOne({ rollNumber: student.rollNumber });
    const applications = await Application.find({ rollNumber: student.rollNumber })
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    const supervisionRequests = await SupervisionRequest.find({ studentId })
      .populate('supervisorId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        student,
        profile,
        applications,
        supervisionRequests
      }
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get student applications (separate endpoint for applications list)
router.get('/students/:studentId/applications', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const applications = await Application.find({ rollNumber: student.rollNumber })
      .populate('companyId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    console.error('Get student applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update student profile (admin override)
router.put('/students/:studentId/profile', async (req, res) => {
  try {
    const { studentId } = req.params;
    const profileData = req.body;
    
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updatedProfile = await Student.findOneAndUpdate(
      { rollNumber: student.rollNumber },
      { ...profileData, updatedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== APPLICATIONS MANAGEMENT ====================

// Update application status (admin override)
router.patch('/applications/:applicationId/status', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, adminNotes } = req.body;

    const application = await Application.findByIdAndUpdate(
      applicationId,
      { 
        overallStatus: status,
        adminNotes,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('companyId', 'name').populate('rollNumber', 'name');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete application (admin override)
router.delete('/applications/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findByIdAndDelete(applicationId);
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== ANALYTICS AND DASHBOARD ====================

// Get dashboard statistics
router.get('/analytics/dashboard-stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalCompanies,
      totalSupervisors,
      totalApplications,
      pendingApplications,
      approvedApplications,
      totalEvaluations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'company' }),
      User.countDocuments({ role: 'supervisor' }),
      Application.countDocuments(),
      Application.countDocuments({ overallStatus: 'pending' }),
      Application.countDocuments({ overallStatus: 'approved' }),
      InterneeEvaluation.countDocuments()
    ]);

    // Get recent activity
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentApplications = await Application.find()
      .populate('rollNumber', 'name')
      .populate('companyId', 'name')
      .select('jobTitle overallStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalStudents,
          totalCompanies,
          totalSupervisors,
          totalApplications,
          pendingApplications,
          approvedApplications,
          totalEvaluations,
          applicationApprovalRate: totalApplications > 0 
            ? ((approvedApplications / totalApplications) * 100).toFixed(1)
            : 0
        },
        recentActivity: {
          users: recentUsers,
          applications: recentApplications
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user activity analytics
router.get('/analytics/user-activity', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user registrations over time
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Get application activity
    const applicationActivity = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$overallStatus"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        userRegistrations,
        applicationActivity,
        timeframe,
        startDate
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== FINAL RESULTS ====================

// Get all student final results
router.get('/final-results', async (req, res) => {
  try {
    const { graduationYear, minCgpa, maxCgpa, evaluationStatus, search } = req.query;

    // Build filter for students
    const studentFilter = {};
    if (graduationYear) studentFilter.graduationYear = graduationYear;
    if (minCgpa) studentFilter.cgpa = { $gte: parseFloat(minCgpa) };
    if (maxCgpa) {
      if (studentFilter.cgpa) {
        studentFilter.cgpa.$lte = parseFloat(maxCgpa);
      } else {
        studentFilter.cgpa = { $lte: parseFloat(maxCgpa) };
      }
    }
    if (search) {
      studentFilter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get students with their applications
    const students = await Student.find(studentFilter)
      .populate({
        path: 'applications',
        populate: {
          path: 'companyId',
          select: 'name'
        }
      })
      .lean();

    // Get evaluations for all students  
    const studentIds = students.map(s => s._id);
    const evaluations = await InterneeEvaluation.find({ 
      studentId: { $in: studentIds } 
    }).lean();

    // Combine student data with their evaluations
    const results = students.map(student => {
      const studentEvaluations = evaluations.filter(
        evalItem => evalItem.studentId && evalItem.studentId.toString() === student._id.toString()
      );

      // Calculate final grade
      let finalGrade = 'Not Evaluated';
      let totalScore = 0;
      let evaluationCount = 0;

      studentEvaluations.forEach(evaluation => {
        if (evaluation.finalGrade) {
          totalScore += parseFloat(evaluation.finalGrade) || 0;
          evaluationCount++;
        }
      });

      if (evaluationCount > 0) {
        const averageScore = totalScore / evaluationCount;
        if (averageScore >= 90) finalGrade = 'A+';
        else if (averageScore >= 85) finalGrade = 'A';
        else if (averageScore >= 80) finalGrade = 'B+';
        else if (averageScore >= 75) finalGrade = 'B';
        else if (averageScore >= 70) finalGrade = 'C+';
        else if (averageScore >= 65) finalGrade = 'C';
        else if (averageScore >= 60) finalGrade = 'D';
        else finalGrade = 'F';
      }

      // Get internship company
      const acceptedApplication = student.applications?.find(app => app.status === 'accepted');
      const companyName = acceptedApplication?.companyId?.name || 'N/A';

      return {
        _id: student._id,
        studentName: student.fullName || student.name || 'Unknown',
        rollNumber: student.rollNumber || 'N/A',
        email: student.email || 'N/A',
        cgpa: student.cgpa || 0,
        graduationYear: student.graduationYear || new Date().getFullYear(),
        department: student.department || 'N/A',
        companyName,
        finalGrade,
        averageScore: evaluationCount > 0 ? (totalScore / evaluationCount).toFixed(2) : 0,
        evaluationCount,
        evaluationStatus: evaluationCount > 0 ? 'Completed' : 'Pending',
        evaluations: studentEvaluations
      };
    });

    // Apply evaluation status filter
    let filteredResults = results;
    if (evaluationStatus) {
      filteredResults = results.filter(result => 
        result.evaluationStatus.toLowerCase() === evaluationStatus.toLowerCase()
      );
    }

    // Calculate statistics
    const totalStudents = filteredResults.length;
    const averageCgpa = totalStudents > 0 
      ? (filteredResults.reduce((sum, student) => sum + (student.cgpa || 0), 0) / totalStudents).toFixed(2)
      : 0;
    const completedEvaluations = filteredResults.filter(r => r.evaluationStatus === 'Completed').length;
    const completionRate = totalStudents > 0 
      ? ((completedEvaluations / totalStudents) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        results: filteredResults,
        statistics: {
          totalStudents,
          averageCgpa: parseFloat(averageCgpa),
          completedEvaluations,
          pendingEvaluations: totalStudents - completedEvaluations,
          completionRate: parseFloat(completionRate)
        }
      }
    });

  } catch (error) {
    console.error('Get final results error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch student results',
      error: error.message 
    });
  }
});

// ==================== NOTIFICATION MANAGEMENT ====================

// Send notification to users
router.post('/send-notification', async (req, res) => {
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

    // For now, we'll just log the notification (you can integrate with email service later)
    console.log(`Notification sent to ${targetUsers.length} users:`, {
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
});

// ==================== EXPORT MANAGEMENT ====================

// Export users data
router.get('/export-users', async (req, res) => {
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
});

module.exports = router;