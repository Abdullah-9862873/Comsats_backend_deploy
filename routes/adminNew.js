const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { roleCheck, auditLogger } = require('../middleware/adminAuth');
const checkDBConnection = require('../middleware/dbCheck');

// Admin Controllers
const {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUserRole,
  updateUserStatus,
  markInactiveUsers,
  getCompanies,
  getCompanyDetails,
  updateCompanyStatus,
  approveCompany,
  rejectCompany,
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
  resetSettings
} = require('../controllers/adminController');

// Apply auth and admin role check to all routes
router.use(auth);
router.use(roleCheck('admin'));
router.use(checkDBConnection); // Check database connection for all admin routes

// Dashboard
router.get('/stats', getDashboardStats);

// User Management
router.get('/users', getUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/role', [
  body('role').isIn(['student', 'company', 'supervisor', 'admin']).withMessage('Invalid role'),
  body('reason').optional().isLength({ max: 200 }).withMessage('Reason must be less than 200 characters')
], auditLogger('USER_ROLE_UPDATED'), updateUserRole);

router.put('/users/:userId/status', [
  body('status').isIn(['active', 'inactive', 'pending']).withMessage('Invalid status')
], auditLogger('USER_STATUS_UPDATED'), updateUserStatus);

router.post('/users/mark-inactive', [
  body('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], auditLogger('BULK_USER_INACTIVE'), markInactiveUsers);

// Company Management  
router.get('/companies', getCompanies);
router.get('/companies/:companyId', getCompanyDetails);
router.post('/companies/:companyId/approve', auditLogger('COMPANY_APPROVED'), approveCompany);
router.post('/companies/:companyId/reject', auditLogger('COMPANY_REJECTED'), rejectCompany);
router.put('/companies/:companyId/status', [
  body('status').isIn(['approved', 'rejected', 'pending']).withMessage('Invalid status'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
], auditLogger('COMPANY_STATUS_UPDATED'), updateCompanyStatus);

// Application Management
router.get('/applications', getApplications);
router.put('/applications/:applicationId/status', [
  body('status').isIn(['pending', 'approved', 'rejected', 'hired']).withMessage('Invalid status'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
], auditLogger('APPLICATION_STATUS_UPDATED'), updateApplicationStatus);

// Job Management
router.get('/jobs', getJobs);
router.get('/jobs/:jobId', getJobDetails);
router.put('/jobs/:jobId', auditLogger('JOB_UPDATED'), updateJob);
router.put('/jobs/:jobId/status', [
  body('status').isIn(['active', 'inactive', 'closed', 'draft']).withMessage('Invalid status'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
], auditLogger('JOB_STATUS_UPDATED'), updateJobStatus);
router.delete('/jobs/:jobId', auditLogger('JOB_DELETED'), deleteJob);

// Reports & Analytics
router.get('/analytics', getAnalytics);
router.post('/reports/generate', [
  body('type').isIn(['users', 'companies', 'jobs', 'applications', 'internships']).withMessage('Invalid report type'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date')
], auditLogger('REPORT_GENERATED'), generateReport);

// System Settings
router.get('/settings', getSettings);
router.put('/settings', auditLogger('SETTINGS_UPDATED'), updateSettings);
router.post('/settings/reset', auditLogger('SETTINGS_RESET'), resetSettings);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

// ==================== FINAL RESULTS ====================

// Get final results ONLY for students who have completed BOTH supervisor and company evaluations
router.get('/final-results', async (req, res) => {
  try {
    console.log('🔍 Admin final-results API called at:', new Date().toLocaleString());
    console.log('📊 Query params:', req.query);
    
    const Student = require('../models/Student');
    const InterneeEvaluation = require('../models/InterneeEvaluation');
    const SupervisorEvaluation = require('../models/SupervisorEvaluation');
    
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

    // Get students
    const students = await Student.find(studentFilter).lean();
    console.log(`📚 Found ${students.length} students matching filter`);

    // Get evaluations for all students  
    const studentIds = students.map(s => s._id);
    
    // Get company evaluations (InterneeEvaluation uses internId field)
    const companyEvaluations = await InterneeEvaluation.find({ 
      internId: { $in: studentIds } 
    }).populate('companyId', 'name email company')
     .populate('applicationId', 'companyName jobTitle')
     .lean();
    console.log(`🏢 Found ${companyEvaluations.length} company evaluations`);

    // Get supervisor evaluations (SupervisorEvaluation uses studentId field)
    const supervisorEvaluations = await SupervisorEvaluation.find({
      studentId: { $in: studentIds }
    }).lean();
    console.log(`👨‍🏫 Found ${supervisorEvaluations.length} supervisor evaluations`);

    // Get applications for these students to find company info
    const Application = require('../models/Application');
    const applications = await Application.find({
      studentId: { $in: studentIds }
    }).populate('companyId', 'name company.companyName')
     .populate('jobId', 'title company')
     .lean();

    // Combine student data with their evaluations - ONLY INCLUDE STUDENTS WITH BOTH EVALUATIONS
    const results = students.map(student => {
      // Find evaluations for this student
      const studentCompanyEvals = companyEvaluations.filter(
        evaluation => evaluation.internId && evaluation.internId.toString() === student._id.toString()
      );
      
      const studentSupervisorEvals = supervisorEvaluations.filter(
        evaluation => evaluation.studentId && evaluation.studentId.toString() === student._id.toString()
      );

      // ONLY PROCESS STUDENTS WHO HAVE BOTH EVALUATIONS
      const hasSupervisorEval = studentSupervisorEvals.length > 0;
      const hasCompanyEval = studentCompanyEvals.length > 0;
      
      // Skip students who don't have both evaluations
      if (!hasSupervisorEval || !hasCompanyEval) {
        return null; // Will be filtered out later
      }

      // Calculate final grade based on the evaluation system used in finalEvaluationController
      let finalGrade = 'Not Evaluated';
      let totalMarks = 0;
      let supervisorMarks = 0;
      let companyMarks = 0;

      // Get supervisor marks (60% weight, totalMarks already out of 60)
      const supervisorEval = studentSupervisorEvals[0]; // Take the first/latest evaluation
      supervisorMarks = supervisorEval.totalMarks || 0; // Already out of 60

      // Get company marks (40% weight, scale from evaluation totalMarks to 40 points)
      const companyEval = studentCompanyEvals[0]; // Take the first/latest evaluation
      const companyTotalMarks = companyEval.evaluation?.totalMarks || 0;
      const companyMaxMarks = companyEval.evaluation?.maxMarks || 40;
      companyMarks = Math.round((companyTotalMarks / companyMaxMarks) * 40); // Scale to 40 points

      // Calculate total marks out of 100 (60 + 40)
      totalMarks = supervisorMarks + companyMarks;

      // Grade calculation based on total percentage
      if (totalMarks >= 90) finalGrade = 'A+';
      else if (totalMarks >= 85) finalGrade = 'A';
      else if (totalMarks >= 80) finalGrade = 'A-';
      else if (totalMarks >= 75) finalGrade = 'B+';
      else if (totalMarks >= 70) finalGrade = 'B';
      else if (totalMarks >= 65) finalGrade = 'B-';
      else if (totalMarks >= 60) finalGrade = 'C+';
      else if (totalMarks >= 55) finalGrade = 'C';
      else if (totalMarks >= 50) finalGrade = 'C-';
      else if (totalMarks >= 40) finalGrade = 'D';
      else finalGrade = 'F';

      // Get internship company from applications
      const studentApplications = applications.filter(app => 
        app.studentId.toString() === student._id.toString()
      );
      
      let companyName = 'N/A';
      
      // Try to find company name from different sources
      // 1. First try accepted/approved applications
      const acceptedApplication = studentApplications.find(app => 
        app.status === 'accepted' || app.overallStatus === 'approved' || app.status === 'hired'
      );
      
      if (acceptedApplication) {
        companyName = acceptedApplication.companyName || // Direct field from Application model
                     acceptedApplication.companyId?.name || 
                     acceptedApplication.companyId?.company?.companyName || 
                     acceptedApplication.jobId?.company?.name ||
                     'Company Found';
      } 
      // 2. If no accepted application, try any application with company info
      else if (studentApplications.length > 0) {
        const anyAppWithCompany = studentApplications.find(app => app.companyName || app.companyId);
        if (anyAppWithCompany) {
          companyName = anyAppWithCompany.companyName || // Direct field from Application model
                       anyAppWithCompany.companyId?.name || 
                       anyAppWithCompany.companyId?.company?.companyName ||
                       'Company from Application';
        }
      }
      // 3. Try to get from company evaluations
      else if (studentCompanyEvals.length > 0) {
        const companyEval = studentCompanyEvals[0];
        companyName = companyEval.applicationId?.companyName || // From populated application
                     companyEval.companyId?.name || // From populated company user
                     companyEval.companyId?.company?.companyName || // From company profile
                     'Company via Evaluation';
      }

      return {
        id: student._id,
        studentInfo: {
          name: student.fullName || student.name || 'Unknown',
          rollNumber: student.rollNumber || 'N/A',
          email: student.email || 'N/A',
          cgpa: student.cgpa || 0,
          graduationYear: student.graduationYear || new Date().getFullYear(),
          department: student.department || 'N/A'
        },
        internshipInfo: {
          companyName
        },
        evaluation: {
          grade: finalGrade,
          totalMarks: totalMarks,
          supervisorMarks: supervisorMarks,
          companyMarks: companyMarks,
          maxMarks: 100,
          status: 'Completed', // All students here have completed evaluations
          hasSupervisorEval: true, // All students here have supervisor evaluations
          hasCompanyEval: true // All students here have company evaluations
        },
        evaluations: {
          supervisor: studentSupervisorEvals,
          company: studentCompanyEvals
        }
      };
    }).filter(result => result !== null); // Remove null entries (students without both evaluations)

    console.log(`📊 Final Results: Showing ${results.length} students with completed evaluations (both company and supervisor)`);
    
    if (results.length > 0) {
      console.log('📋 Students being returned:');
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.studentInfo.name} - ${result.evaluation.totalMarks}/100 (${result.evaluation.grade}) - Company: ${result.internshipInfo.companyName}`);
      });
    } else {
      console.log('⚠️ No students found with both evaluations completed');
    }

    // Apply evaluation status filter (though all students here have completed evaluations)
    let filteredResults = results;
    if (evaluationStatus && evaluationStatus.toLowerCase() !== 'completed') {
      // If filtering for anything other than 'completed', return empty results
      // since we only show students with completed evaluations
      filteredResults = [];
    }

    // Calculate statistics (all filtered results have completed evaluations)
    const totalStudents = filteredResults.length;
    const averageCgpa = totalStudents > 0 
      ? (filteredResults.reduce((sum, student) => sum + (student.studentInfo.cgpa || 0), 0) / totalStudents).toFixed(2)
      : 0;
    const completedEvaluations = filteredResults.length; // All students here have completed evaluations
    const completionRate = totalStudents > 0 ? '100.0' : '0'; // 100% since we only show completed ones

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
    const User = require('../models/User');
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
    const User = require('../models/User');
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