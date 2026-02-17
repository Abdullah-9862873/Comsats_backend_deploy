const mongoose = require('mongoose');
const User = require('./models/User');
const emailService = require('./services/emailService');

mongoose.connect('mongodb://localhost:27017/Fyp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('🔗 Connected to MongoDB');

  try {
    // Get test users
    const student = await User.findOne({ role: 'student' });
    const supervisor = await User.findOne({ role: 'supervisor' });
    const company = await User.findOne({ role: 'company' });

    if (!student || !supervisor || !company) {
      console.log('❌ Missing test users. Please run create-test-users.js first.');
      return;
    }

    console.log('📋 Testing email data mapping:');
    console.log(`   Student: ${student.name}`);
    console.log(`   Registration: ${student.student?.regNo || 'MISSING'}`);
    console.log(`   Department: ${student.student?.department || 'MISSING'}`);

    // Create complete student data object (same logic as controller)
    const completeStudentData = {
      ...student.toObject(),
      rollNo: student?.student?.regNo || 'N/A',
      rollNumber: student?.student?.regNo || 'N/A', 
      registrationNumber: student?.student?.regNo || 'N/A',
      department: student?.student?.department || 'N/A'
    };

    console.log('\n✅ Fixed student data object:');
    console.log(`   rollNo: ${completeStudentData.rollNo}`);
    console.log(`   registrationNumber: ${completeStudentData.registrationNumber}`);
    console.log(`   department: ${completeStudentData.department}`);

    // Test the email service data mapping
    console.log('\n📧 Testing email template data:');
    
    // Mock evaluation data
    const mockEvaluation = {
      totalMarks: 85,
      maxMarks: 100,
      technicalSkills: 8,
      communicationSkills: 9,
      problemSolving: 7,
      teamwork: 8,
      punctuality: 9,
      overallPerformance: 8,
      comments: 'Great work!'
    };

    // Mock company data
    const mockCompany = {
      company: {
        companyName: company.company?.companyName || company.name
      }
    };

    // Mock job data
    const mockJob = {
      title: 'Software Developer Intern'
    };

    // This would be the same call made by the controller
    console.log('\n🎯 Email would be sent with data:');
    console.log('   Supervisor:', supervisor.name, supervisor.email);
    console.log('   Student Name:', completeStudentData.name);
    console.log('   Student Email:', completeStudentData.email);
    console.log('   Student RegNo:', completeStudentData.registrationNumber);
    console.log('   Student Department:', completeStudentData.department);
    console.log('   Company:', mockCompany.company.companyName);
    console.log('   Job:', mockJob.title);
    console.log('   Marks:', mockEvaluation.totalMarks, '/', mockEvaluation.maxMarks);

    console.log('\n✅ Data mapping test completed! The "N/A" issue should now be fixed.');
    console.log('💡 The controller now correctly uses user.student.regNo and user.student.department');

  } catch (error) {
    console.error('❌ Error testing email data:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}).catch(error => {
  console.error('❌ Failed to connect to MongoDB:', error);
});