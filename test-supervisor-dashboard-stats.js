require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const ProgressReport = require('./models/ProgressReport');
const InternshipAppraisal = require('./models/InternshipAppraisal');
const MisconductReport = require('./models/MisconductReport');
const SupervisionRequest = require('./models/SupervisionRequest');

async function testSupervisorDashboardStats() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // Find a supervisor user
    console.log('🔍 Finding supervisor...');
    const supervisor = await User.findOne({ role: 'supervisor' }).select('_id name email');
    
    if (!supervisor) {
      console.log('❌ No supervisor found in database');
      process.exit(0);
    }

    console.log('✅ Found Supervisor:');
    console.log('   Name:', supervisor.name);
    console.log('   Email:', supervisor.email);
    console.log('   ID:', supervisor._id);
    console.log();

    // Find students supervised by this supervisor
    console.log('👥 Finding supervised students...');
    const studentUsers = await User.find({ 
      role: 'student',
      'student.supervisorId': supervisor._id
    }).select('_id email name');

    console.log(`   Found ${studentUsers.length} student user(s)`);
    
    if (studentUsers.length === 0) {
      console.log('⚠️  No students assigned to this supervisor yet');
    } else {
      const studentEmails = studentUsers.map(u => u.email);
      
      // Get Student profiles
      const students = await Student.find({
        email: { $in: studentEmails }
      }).select('_id email rollNumber name internshipStatus');

      console.log(`   Found ${students.length} student profile(s)`);
      
      students.forEach(s => {
        console.log(`   - ${s.name} (${s.rollNumber}) - Status: ${s.internshipStatus || 'N/A'}`);
      });

      const studentIds = students.map(s => s._id);
      console.log();

      // Count Progress Reports
      console.log('📊 Counting Progress Reports...');
      const totalProgressReports = await ProgressReport.countDocuments({ 
        studentId: { $in: studentIds }
      });
      const pendingProgressReports = await ProgressReport.countDocuments({ 
        studentId: { $in: studentIds },
        status: { $in: ['pending', 'submitted'] }
      });
      console.log(`   Total: ${totalProgressReports} | Pending: ${pendingProgressReports}`);

      // Count Internship Appraisals
      console.log('📊 Counting Internship Appraisals...');
      const totalAppraisals = await InternshipAppraisal.countDocuments({ 
        studentId: { $in: studentIds }
      });
      const pendingAppraisals = await InternshipAppraisal.countDocuments({ 
        studentId: { $in: studentIds },
        status: { $in: ['pending', 'submitted'] }
      });
      console.log(`   Total: ${totalAppraisals} | Pending: ${pendingAppraisals}`);

      // Count Misconduct Reports
      console.log('📊 Counting Misconduct Reports...');
      const totalMisconduct = await MisconductReport.countDocuments({ 
        studentId: { $in: studentIds }
      });
      const pendingMisconduct = await MisconductReport.countDocuments({ 
        studentId: { $in: studentIds },
        status: { $in: ['pending', 'submitted'] }
      });
      console.log(`   Total: ${totalMisconduct} | Pending: ${pendingMisconduct}`);

      console.log();
      console.log('📋 Summary:');
      console.log(`   Total Student Reports: ${totalProgressReports + totalAppraisals + totalMisconduct}`);
      console.log(`   Total Pending: ${pendingProgressReports + pendingAppraisals + pendingMisconduct}`);
    }

    // Count Supervision Requests
    console.log();
    console.log('📩 Counting Supervision Requests...');
    const supervisionRequests = await SupervisionRequest.countDocuments({
      supervisorId: supervisor._id,
      status: 'pending'
    });
    console.log(`   Pending Requests: ${supervisionRequests}`);

    console.log();
    console.log('✅ Test Complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testSupervisorDashboardStats();
