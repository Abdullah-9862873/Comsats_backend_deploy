const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const Student = require('./models/Student');
const InterneeEvaluation = require('./models/InterneeEvaluation');

async function checkFinalResultsData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check students count
    const studentsCount = await Student.countDocuments();
    console.log(`📊 Total Students: ${studentsCount}`);

    // Check evaluations count
    const evaluationsCount = await InterneeEvaluation.countDocuments();
    console.log(`📋 Total Evaluations: ${evaluationsCount}`);

    // Get sample student data
    const sampleStudents = await Student.find()
      .limit(3)
      .lean();

    console.log('\n📝 Sample Students:');
    sampleStudents.forEach((student, index) => {
      console.log(`${index + 1}. Name: ${student.fullName || student.name || 'N/A'}`);
      console.log(`   Email: ${student.email || 'N/A'}`);
      console.log(`   Roll Number: ${student.rollNumber || 'N/A'}`);
      console.log(`   CGPA: ${student.cgpa || 'N/A'}`);
      console.log(`   Department: ${student.department || 'N/A'}`);
      console.log(`   Graduation Year: ${student.graduationYear || 'N/A'}`);
      console.log('');
    });

    // Get sample evaluations
    const sampleEvaluations = await InterneeEvaluation.find()
      .limit(3)
      .lean();

    console.log('📋 Sample Evaluations:');
    sampleEvaluations.forEach((eval, index) => {
      console.log(`${index + 1}. Student ID: ${eval.studentId}`);
      console.log(`   Final Grade: ${eval.finalGrade || 'N/A'}`);
      console.log(`   Evaluation Type: ${eval.evaluationType || 'N/A'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkFinalResultsData();