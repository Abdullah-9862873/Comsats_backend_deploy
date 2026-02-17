const mongoose = require('mongoose');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');
const Job = require('./models/Job');
const Application = require('./models/Application');
const WeeklyReport = require('./models/WeeklyReport');
const AuditLog = require('./models/AuditLog');
require('dotenv').config();

async function testDashboardStats() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Testing Dashboard Statistics\n');

    // Count all the data exactly like the API does
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
      Job.countDocuments({ status: 'Active' }), // Note: checking both 'active' and 'Active'
      Application.countDocuments({ status: 'pending' }),
      CompanyProfile.countDocuments({ status: 'pending' }),
      WeeklyReport.countDocuments(),
      AuditLog.find()
        .populate('adminUserId', 'name email')
        .sort({ timestamp: -1 })
        .limit(10)
    ]);

    console.log('=== USER STATISTICS ===');
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`🎓 Total Students: ${totalStudents}`);
    console.log(`🏢 Total Companies: ${totalCompanies}`);
    console.log(`👨‍🏫 Total Supervisors: ${totalSupervisors}`);

    console.log('\n=== JOB STATISTICS ===');
    console.log(`💼 Active Jobs: ${activeJobs}`);
    
    // Check both 'active' and 'Active' status
    const activeJobsLowercase = await Job.countDocuments({ status: 'active' });
    const activeJobsCapitalized = await Job.countDocuments({ status: 'Active' });
    console.log(`   - Jobs with status 'active': ${activeJobsLowercase}`);
    console.log(`   - Jobs with status 'Active': ${activeJobsCapitalized}`);

    console.log('\n=== APPLICATION STATISTICS ===');
    console.log(`📋 Pending Applications: ${pendingApplications}`);
    
    // Check all application statuses
    const allApplications = await Application.countDocuments();
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });
    console.log(`   - Total Applications: ${allApplications}`);
    console.log(`   - Approved Applications: ${approvedApplications}`);
    console.log(`   - Rejected Applications: ${rejectedApplications}`);

    console.log('\n=== COMPANY STATISTICS ===');
    console.log(`🏭 Pending Companies: ${pendingCompanies}`);
    
    // Check all company statuses
    const allCompanies = await CompanyProfile.countDocuments();
    const approvedCompanies = await CompanyProfile.countDocuments({ status: 'approved' });
    console.log(`   - Total Company Profiles: ${allCompanies}`);
    console.log(`   - Approved Companies: ${approvedCompanies}`);

    console.log('\n=== REPORT STATISTICS ===');
    console.log(`📄 Total Reports: ${totalReports}`);

    console.log('\n=== RECENT ACTIVITY ===');
    console.log(`🔍 Recent Audit Logs: ${recentAuditLogs.length}`);

    // Show the final stats object that would be returned by the API
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

    console.log('\n📊 FINAL STATS OBJECT:');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n✅ Dashboard statistics test completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDashboardStats();