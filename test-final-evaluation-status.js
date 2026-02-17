const mongoose = require('mongoose');
const User = require('./models/User');
const SupervisorEvaluation = require('./models/SupervisorEvaluation');

mongoose.connect('mongodb://localhost:27017/Fyp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('🔗 Connected to MongoDB');

  try {
    // Get test users
    const student = await User.findOne({ role: 'student' });
    const supervisor = await User.findOne({ role: 'supervisor' });

    if (!student || !supervisor) {
      console.log('❌ Missing test users. Please run create-test-users.js first.');
      return;
    }

    console.log('📋 Testing Final Evaluation Status Tracking:');
    console.log(`   Student: ${student.name} (${student.student?.regNo})`);
    console.log(`   Supervisor: ${supervisor.name}`);

    // Create a test supervisor evaluation
    const testEvaluation = new SupervisorEvaluation({
      studentId: student._id,
      studentName: student.name,
      studentRegistration: student.student?.regNo || 'TEST-001',
      supervisorId: supervisor._id,
      supervisorName: supervisor.name,
      internshipDuration: '3 months',
      internshipStartDate: new Date('2024-01-15'),
      internshipEndDate: new Date('2024-04-15'),
      position: 'Software Developer Intern',
      platformActivity: 8,
      communicationSkills: 9,
      problemSolving: 7,
      teamwork: 8,
      punctuality: 9,
      overallPerformance: 8,
      totalMarks: 48 // Out of 60
    });

    // Save the evaluation
    await testEvaluation.save();
    console.log('\n✅ Created test supervisor evaluation');

    // Check initial status
    console.log('\n📊 Initial Status:');
    console.log(`   finalResultSent: ${testEvaluation.finalResultSent}`);
    console.log(`   finalResultSentAt: ${testEvaluation.finalResultSentAt || 'Not set'}`);
    console.log(`   finalResultSentBy: ${testEvaluation.finalResultSentBy || 'Not set'}`);

    // Simulate sending final result
    console.log('\n📤 Simulating final result sending...');
    await SupervisorEvaluation.findByIdAndUpdate(testEvaluation._id, {
      finalResultSent: true,
      finalResultSentAt: new Date(),
      finalResultSentBy: supervisor._id
    });

    // Check updated status
    const updatedEvaluation = await SupervisorEvaluation.findById(testEvaluation._id);
    console.log('\n📊 Updated Status:');
    console.log(`   finalResultSent: ${updatedEvaluation.finalResultSent}`);
    console.log(`   finalResultSentAt: ${updatedEvaluation.finalResultSentAt}`);
    console.log(`   finalResultSentBy: ${updatedEvaluation.finalResultSentBy}`);

    // Test the filtering logic
    console.log('\n🔍 Testing Filtering Logic:');
    
    // Get evaluations not sent yet
    const notSent = await SupervisorEvaluation.find({
      supervisorId: supervisor._id,
      finalResultSent: false
    });
    
    // Get evaluations already sent
    const alreadySent = await SupervisorEvaluation.find({
      supervisorId: supervisor._id,
      finalResultSent: true
    });

    console.log(`   Ready to Send: ${notSent.length} evaluations`);
    console.log(`   Results Sent: ${alreadySent.length} evaluations`);

    if (alreadySent.length > 0) {
      console.log(`   Last sent at: ${alreadySent[0].finalResultSentAt}`);
    }

    console.log('\n🎉 Final Evaluation Status Tracking Test Completed!');
    console.log('\n📝 Summary of Changes:');
    console.log('   ✅ Added finalResultSent, finalResultSentAt, finalResultSentBy fields');
    console.log('   ✅ Controller now checks and prevents duplicate sending');
    console.log('   ✅ API returns separate sections: readyToSend and resultsSent');
    console.log('   ✅ New viewSentResult endpoint for read-only access');
    
    // Clean up test data
    await SupervisorEvaluation.findByIdAndDelete(testEvaluation._id);
    console.log('\n🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Error testing final evaluation status:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}).catch(error => {
  console.error('❌ Failed to connect to MongoDB:', error);
});