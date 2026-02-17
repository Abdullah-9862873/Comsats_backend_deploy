const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const Student = require('./models/Student');
const User = require('./models/User');
const MisconductReport = require('./models/MisconductReport');

const testSupervisorMisconductReports = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find a supervisor
    const supervisor = await User.findOne({ role: 'supervisor' });
    if (!supervisor) {
      console.log('❌ No supervisor found');
      process.exit(1);
    }
    console.log('Found supervisor:', supervisor.name);

    // Find a student with this supervisor selected
    const student = await Student.findOne({ selectedSupervisorId: supervisor._id });
    if (!student) {
      console.log('❌ No student found with this supervisor selected');
      
      // Create a test student for this supervisor
      const testStudent = new Student({
        name: 'Test Student for Misconduct',
        email: 'teststudent.misconduct@test.com',
        rollNumber: 'TEST-MISC-001',
        selectedSupervisorId: supervisor._id,
        department: 'Computer Science',
        semester: '8th',
        cgpa: 3.5
      });
      
      await testStudent.save();
      console.log('✅ Created test student:', testStudent.name);
      
      // Create a test misconduct report
      const testReport = new MisconductReport({
        studentId: testStudent._id,
        studentName: testStudent.name,
        companyId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company Ltd',
        supervisorId: supervisor._id,
        supervisorName: supervisor.name,
        issueType: 'Unprofessional Behavior',
        incidentDate: new Date(),
        description: 'This is a test misconduct report description that is longer than 200 characters. The student showed unprofessional behavior during the internship period. This includes arriving late to work, not following company policies, and showing disrespectful attitude towards colleagues and supervisors.'
      });
      
      await testReport.save();
      console.log('✅ Created test misconduct report');
      
      // Test getting reports for this supervisor
      const reports = await MisconductReport.find({ supervisorId: supervisor._id });
      console.log(`✅ Found ${reports.length} reports for supervisor`);
      
      if (reports.length > 0) {
        console.log('Report details:');
        reports.forEach((report, index) => {
          console.log(`${index + 1}. Student: ${report.studentName}`);
          console.log(`   Company: ${report.companyName}`);
          console.log(`   Issue: ${report.issueType}`);
          console.log(`   Status: ${report.status}`);
          console.log(`   Date: ${report.createdAt}`);
          console.log('---');
        });
      }
      
      // Cleanup
      await Student.findByIdAndDelete(testStudent._id);
      await MisconductReport.findByIdAndDelete(testReport._id);
      console.log('✅ Cleanup completed');
      
    } else {
      console.log('Found student:', student.name);
      
      // Test getting reports for this supervisor
      const reports = await MisconductReport.find({ supervisorId: supervisor._id });
      console.log(`✅ Found ${reports.length} reports for supervisor`);
      
      if (reports.length > 0) {
        console.log('Report details:');
        reports.forEach((report, index) => {
          console.log(`${index + 1}. Student: ${report.studentName}`);
          console.log(`   Company: ${report.companyName}`);
          console.log(`   Issue: ${report.issueType}`);
          console.log(`   Status: ${report.status}`);
          console.log(`   Date: ${report.createdAt}`);
          console.log('---');
        });
      }
    }

    console.log('✅ Test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testSupervisorMisconductReports();
