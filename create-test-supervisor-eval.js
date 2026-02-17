const mongoose = require('mongoose');
const SupervisorEvaluation = require('./models/SupervisorEvaluation');
const User = require('./models/User');

// Connect using environment variable or direct connection
async function main() {
  try {
    await mongoose.connect('mongodb+srv://imrankabir:kabir1234@cluster0.n5hjckh.mongodb.net/fyp_internship_system');
    console.log('✅ Connected to MongoDB');

    const supervisorId = '68ba833c1d183b72f00855d9'; // Supervisor_1
    const studentId = '68ba82771d183b72f0085585'; // Student_1

    // Check if a supervisor evaluation already exists
    const existingEval = await SupervisorEvaluation.findOne({
      studentId,
      supervisorId
    });

    if (existingEval) {
      console.log('✅ Supervisor evaluation already exists:', existingEval.totalMarks);
    } else {
      console.log('📝 Creating test supervisor evaluation...');
      
      // Create a sample supervisor evaluation
      const supervisorEval = new SupervisorEvaluation({
        studentId: studentId,
        studentName: 'Student_1',
        studentRegistration: 'SP22-BCS-006',
        supervisorId: supervisorId,
        supervisorName: 'Supervisor_1',
        internshipDuration: '3 months',
        internshipStartDate: new Date('2024-09-01'),
        internshipEndDate: new Date('2024-12-01'),
        position: 'Java Developer',
        
        // Individual scores (1-10 each, total will be 6*8 = 48/60)
        platformActivity: 8,
        completionOfInternship: 9,
        earningsAchieved: 7,
        skillDevelopment: 8,
        clientRating: 8,
        professionalism: 8,
        
        // Calculate total (should be 48)
        totalMarks: 48,
        grade: 'B+'
      });

      await supervisorEval.save();
      console.log('✅ Test supervisor evaluation created with total marks:', supervisorEval.totalMarks);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

main();
