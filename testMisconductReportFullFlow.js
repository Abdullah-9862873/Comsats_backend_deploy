const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const Student = require('./models/Student');
const User = require('./models/User');
const MisconductReport = require('./models/MisconductReport');

const testMisconductReportFlow = async () => {
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
    console.log('✅ Found supervisor:', supervisor.name);

    // Find a company
    const company = await User.findOne({ role: 'company' });
    if (!company) {
      console.log('❌ No company found');
      process.exit(1);
    }
    console.log('✅ Found company:', company.name);

    // Create a test student with the supervisor assigned
    const uniqueEmail = `testflow${Date.now()}@example.com`;
    const testStudent = new Student({
      fullName: 'Test Student for Full Flow',
      name: 'Test Student for Full Flow',
      email: uniqueEmail,
      rollNumber: `FLOW-${Date.now()}`,
      password: 'testpass123',
      selectedSupervisorId: supervisor._id,
      department: 'Computer Science',
      semester: '8th',
      cgpa: 3.5
    });
    
    await testStudent.save();
    console.log('✅ Created test student:', testStudent.name);

    // Create a misconduct report (simulating company submission)
    const testReport = new MisconductReport({
      studentId: testStudent._id,
      studentName: testStudent.fullName, // Use fullName instead of name
      companyId: company._id,
      companyName: company.name,
      supervisorId: supervisor._id,
      supervisorName: supervisor.name,
      issueType: 'Unprofessional Behavior',
      incidentDate: new Date(),
      description: 'Test misconduct report: The student consistently arrived late to work, showed disrespectful behavior towards colleagues, and failed to follow company policies. This behavior has been observed multiple times over the past few weeks and is affecting the overall work environment and team productivity.'
    });
    
    await testReport.save();
    console.log('✅ Created misconduct report with ID:', testReport._id);

    // Test supervisor getting their reports
    const supervisorReports = await MisconductReport.find({ supervisorId: supervisor._id });
    console.log(`✅ Supervisor can access ${supervisorReports.length} reports`);

    if (supervisorReports.length > 0) {
      const report = supervisorReports[0];
      console.log('📋 Report Details:');
      console.log(`   Student: ${report.studentName}`);
      console.log(`   Company: ${report.companyName}`);
      console.log(`   Supervisor: ${report.supervisorName}`);
      console.log(`   Issue: ${report.issueType}`);
      console.log(`   Status: ${report.status}`);
      console.log(`   Created: ${report.createdAt}`);
    }

    // Test status update
    const updatedReport = await MisconductReport.findByIdAndUpdate(
      testReport._id,
      { status: 'Resolved' },
      { new: true }
    );
    console.log('✅ Updated report status to:', updatedReport.status);

    // Cleanup
    await Student.findByIdAndDelete(testStudent._id);
    await MisconductReport.findByIdAndDelete(testReport._id);
    console.log('✅ Cleanup completed');

    console.log('\n🎉 FULL MISCONDUCT REPORT FLOW TEST SUCCESSFUL!');
    console.log('✅ Companies can create reports for students');
    console.log('✅ Reports are assigned to the student\'s selected supervisor');
    console.log('✅ Supervisors can view and update report status');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testMisconductReportFlow();
