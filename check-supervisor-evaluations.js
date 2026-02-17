const mongoose = require('mongoose');
const SupervisorEvaluation = require('./models/SupervisorEvaluation');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://imrankabir:kabir1234@cluster0.n5hjckh.mongodb.net/fyp_internship_system')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return checkSupervisorEvaluations();
  })
  .catch(console.error);

async function checkSupervisorEvaluations() {
  try {
    console.log('\n🔍 Checking Supervisor Evaluations...');
    
    const supervisorId = '68ba833c1d183b72f00855d9'; // Supervisor_1
    
    // Check all supervisor evaluations
    const allEvals = await SupervisorEvaluation.find();
    console.log(`📊 Total supervisor evaluations in database: ${allEvals.length}`);
    
    if (allEvals.length > 0) {
      console.log('\n📋 Sample evaluations:');
      allEvals.slice(0, 3).forEach(eval => {
        console.log(`  - Student: ${eval.studentName} (${eval.studentId})`);
        console.log(`    Supervisor: ${eval.supervisorName} (${eval.supervisorId})`);
        console.log(`    Total Marks: ${eval.totalMarks}`);
        console.log(`    Grade: ${eval.grade}`);
        console.log('    ---');
      });
    }
    
    // Check evaluations for this specific supervisor
    const supervisorEvals = await SupervisorEvaluation.find({ supervisorId });
    console.log(`\n🎯 Evaluations by Supervisor_1: ${supervisorEvals.length}`);
    
    if (supervisorEvals.length > 0) {
      supervisorEvals.forEach(eval => {
        console.log(`  - ${eval.studentName}: ${eval.totalMarks}/60 (${eval.grade})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}
