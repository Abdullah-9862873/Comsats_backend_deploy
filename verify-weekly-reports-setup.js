const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Application = require('./models/Application');
const User = require('./models/User');
const WeeklyReportEvent = require('./models/WeeklyReportEvent');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const verifyWeeklyReportsSetup = async () => {
  try {
    console.log('🔍 Verifying Weekly Reports Setup...\n');

    // 1. Check supervisors
    const supervisors = await User.find({ role: 'supervisor' });
    console.log(`👨‍🏫 Found ${supervisors.length} supervisors:`);
    supervisors.forEach(sup => {
      console.log(`  - ${sup.name} (${sup._id})`);
    });

    // 2. Check students
    const students = await User.find({ role: 'student' });
    console.log(`\n👨‍🎓 Found ${students.length} students:`);
    students.forEach(student => {
      console.log(`  - ${student.name} (${student._id})`);
    });

    // 3. Check approved applications
    const approvedApplications = await Application.find({
      supervisorStatus: 'approved'
    }).populate('studentId', 'name email').populate('supervisorId', 'name email');

    console.log(`\n📝 Found ${approvedApplications.length} approved applications:`);
    approvedApplications.forEach(app => {
      console.log(`  - Student: ${app.studentId?.name} -> Supervisor: ${app.supervisorId?.name}`);
    });

    // 4. Check weekly report events
    const weeklyEvents = await WeeklyReportEvent.find({});
    console.log(`\n📊 Found ${weeklyEvents.length} weekly report events:`);
    weeklyEvents.forEach(event => {
      console.log(`  - Week ${event.weekNumber}: ${event.title} (Supervisor: ${event.supervisorName})`);
    });

    // 5. For each student, check if they have approved applications
    console.log(`\n🔗 Student-Supervisor Relationships:`);
    for (const student of students) {
      const studentApprovedApp = await Application.findOne({
        studentId: student._id,
        supervisorStatus: 'approved'
      }).populate('supervisorId', 'name');

      if (studentApprovedApp) {
        console.log(`  ✅ ${student.name} -> ${studentApprovedApp.supervisorId.name}`);
        
        // Check if this supervisor has any weekly events
        const supervisorEvents = await WeeklyReportEvent.find({
          supervisorId: studentApprovedApp.supervisorId._id,
          status: 'active'
        });
        console.log(`     📋 ${supervisorEvents.length} active events from this supervisor`);
      } else {
        console.log(`  ❌ ${student.name} -> No approved application`);
      }
    }

    console.log('\n🎯 Setup Analysis Complete!');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

verifyWeeklyReportsSetup();
