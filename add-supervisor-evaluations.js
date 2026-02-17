// Script to create test supervisor evaluations for students who have company evaluations
const mongoose = require('mongoose');

// Define the SupervisorEvaluation schema directly (in case model loading fails)
const supervisorEvaluationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentRegistration: { type: String, required: true },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supervisorName: { type: String, required: true },
  internshipDuration: { type: String, required: true },
  internshipStartDate: { type: Date, required: true },
  internshipEndDate: { type: Date, required: true },
  position: { type: String, required: true },
  platformActivity: { type: Number, required: true, min: 1, max: 10 },
  completionOfInternship: { type: Number, required: true, min: 1, max: 10 },
  earningsAchieved: { type: Number, required: true, min: 1, max: 10 },
  skillDevelopment: { type: Number, required: true, min: 1, max: 10 },
  clientRating: { type: Number, required: true, min: 1, max: 10 },
  professionalism: { type: Number, required: true, min: 1, max: 10 },
  totalMarks: { type: Number, required: true, min: 6, max: 60 },
  grade: { type: String, required: true, enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'] },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'reviewed', 'finalized'], default: 'submitted' }
}, { timestamps: true });

supervisorEvaluationSchema.index({ studentId: 1, supervisorId: 1 }, { unique: true });

async function createSupervisorEvaluations() {
  try {
    // Connect to MongoDB using the environment connection
    const mongoUri = 'mongodb+srv://imrankabir:kabir1234@cluster0.n5hjckh.mongodb.net/fyp_internship_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const SupervisorEvaluation = mongoose.model('SupervisorEvaluation', supervisorEvaluationSchema);
    
    const supervisorId = '68ba833c1d183b72f00855d9'; // Supervisor_1 ID

    // Test supervisor evaluations for students who have company evaluations
    const testEvaluations = [
      {
        studentId: '68ba82771d183b72f0085585', // Student_1
        studentName: 'Student_1',
        studentRegistration: 'SP22-BCS-006',
        supervisorId: supervisorId,
        supervisorName: 'Supervisor_1',
        internshipDuration: '3 months',
        internshipStartDate: new Date('2024-09-01'),
        internshipEndDate: new Date('2024-12-01'),
        position: 'Java Developer',
        platformActivity: 8,      // 8/10
        completionOfInternship: 9, // 9/10
        earningsAchieved: 7,      // 7/10
        skillDevelopment: 8,      // 8/10
        clientRating: 8,          // 8/10
        professionalism: 8,       // 8/10
        totalMarks: 48,           // Total: 48/60 (80%)
        grade: 'B+'
      },
      {
        studentId: '68ba97459dac321ab5ec45ad', // Student_2
        studentName: 'Student_2',
        studentRegistration: 'SP22-BCS-002',
        supervisorId: supervisorId,
        supervisorName: 'Supervisor_1',
        internshipDuration: '3 months',
        internshipStartDate: new Date('2024-09-08'),
        internshipEndDate: new Date('2024-12-08'),
        position: 'Java Developer',
        platformActivity: 9,      // 9/10
        completionOfInternship: 10, // 10/10
        earningsAchieved: 8,      // 8/10
        skillDevelopment: 9,      // 9/10
        clientRating: 9,          // 9/10
        professionalism: 9,       // 9/10
        totalMarks: 54,           // Total: 54/60 (90%)
        grade: 'A'
      },
      {
        studentId: '68bbee20471e9216fbd0bb1d', // Student_5
        studentName: 'Student_5',
        studentRegistration: 'SP22-BCS-005',
        supervisorId: supervisorId,
        supervisorName: 'Supervisor_1',
        internshipDuration: '3 months',
        internshipStartDate: new Date('2024-09-15'),
        internshipEndDate: new Date('2024-12-15'),
        position: 'Computer Vision Engineer',
        platformActivity: 9,      // 9/10
        completionOfInternship: 8, // 8/10
        earningsAchieved: 8,      // 8/10
        skillDevelopment: 10,     // 10/10
        clientRating: 9,          // 9/10
        professionalism: 8,       // 8/10
        totalMarks: 52,           // Total: 52/60 (87%)
        grade: 'A'
      },
      {
        studentId: '68c1689a6909d193253ba601', // Student_7
        studentName: 'Student_7',
        studentRegistration: 'SP22-BCS-020',
        supervisorId: supervisorId,
        supervisorName: 'Supervisor_1',
        internshipDuration: '3 months',
        internshipStartDate: new Date('2024-06-01'),
        internshipEndDate: new Date('2024-08-31'),
        position: 'AI Engineer',
        platformActivity: 8,      // 8/10
        completionOfInternship: 8, // 8/10
        earningsAchieved: 7,      // 7/10
        skillDevelopment: 9,      // 9/10
        clientRating: 8,          // 8/10
        professionalism: 8,       // 8/10
        totalMarks: 48,           // Total: 48/60 (80%)
        grade: 'B+'
      }
    ];

    console.log('\n📝 Creating supervisor evaluations...');
    
    for (const evalData of testEvaluations) {
      try {
        // Check if evaluation already exists
        const existing = await SupervisorEvaluation.findOne({
          studentId: evalData.studentId,
          supervisorId: evalData.supervisorId
        });

        if (existing) {
          console.log(`⚠️  Evaluation already exists for ${evalData.studentName}`);
          continue;
        }

        // Create new evaluation
        const evaluation = new SupervisorEvaluation(evalData);
        await evaluation.save();
        
        console.log(`✅ Created evaluation for ${evalData.studentName}: ${evalData.totalMarks}/60 (${evalData.grade})`);
        
      } catch (error) {
        console.error(`❌ Error creating evaluation for ${evalData.studentName}:`, error.message);
      }
    }

    console.log('\n🎉 Supervisor evaluations creation completed!');
    
    // Verify created evaluations
    const allEvals = await SupervisorEvaluation.find({ supervisorId });
    console.log(`\n📊 Total supervisor evaluations for Supervisor_1: ${allEvals.length}`);
    
    allEvals.forEach(eval => {
      console.log(`  - ${eval.studentName}: ${eval.totalMarks}/60 (${eval.grade})`);
    });

  } catch (error) {
    console.error('❌ Connection or creation error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSupervisorEvaluations().catch(console.error);
