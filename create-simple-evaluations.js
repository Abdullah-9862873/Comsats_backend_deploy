const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const InterneeEvaluation = require('./models/InterneeEvaluation');
const User = require('./models/User');

async function createSimpleTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get some students
    const students = await User.find({ role: 'student' }).limit(3);
    console.log(`Found ${students.length} students`);

    if (students.length === 0) {
      console.log('⚠️ No students found in database');
      return;
    }

    // Create simple test company evaluations
    const testEvaluations = [
      {
        studentId: students[0]._id,
        studentName: students[0].name,
        studentEmail: students[0].email,
        registrationNumber: students[0].registrationNumber,
        companyName: "Tech Innovation Inc",
        punctualityAndAttendance: 9,
        abilityToLinkTheoryToPractice: 8,
        demonstratedCriticalThinking: 8,
        technicalKnowledge: 9,
        creativityConceptualAbility: 7,
        abilityToAdaptToVarietyOfTasks: 8,
        timeManagementDeadlineCompliance: 9,
        behavedInProfessionalManner: 10,
        effectivelyPerformedAssignments: 8,
        oralWrittenCommunicationSkills: 8,
        overallRating: 8.4,
        wouldRecommend: true,
        recommendation: "Excellent intern with strong technical skills and professional attitude. Would definitely recommend for future opportunities.",
        position: "Software Engineer Intern",
        submittedAt: new Date('2025-09-10')
      },
      {
        studentId: students[1]._id,
        studentName: students[1].name,
        studentEmail: students[1].email,
        registrationNumber: students[1].registrationNumber,
        companyName: "Data Solutions Corp",
        punctualityAndAttendance: 8,
        abilityToLinkTheoryToPractice: 7,
        demonstratedCriticalThinking: 7,
        technicalKnowledge: 8,
        creativityConceptualAbility: 8,
        abilityToAdaptToVarietyOfTasks: 7,
        timeManagementDeadlineCompliance: 8,
        behavedInProfessionalManner: 9,
        effectivelyPerformedAssignments: 7,
        oralWrittenCommunicationSkills: 8,
        overallRating: 7.7,
        wouldRecommend: true,
        recommendation: "Good performance overall. Shows potential for growth with more experience.",
        position: "Data Analyst Intern",
        submittedAt: new Date('2025-09-09')
      },
      {
        studentId: students[2] ? students[2]._id : students[0]._id,
        studentName: students[2] ? students[2].name : students[0].name,
        studentEmail: students[2] ? students[2].email : students[0].email,
        registrationNumber: students[2] ? students[2].registrationNumber : students[0].registrationNumber,
        companyName: "WebDev Masters",
        punctualityAndAttendance: 10,
        abilityToLinkTheoryToPractice: 9,
        demonstratedCriticalThinking: 9,
        technicalKnowledge: 9,
        creativityConceptualAbility: 9,
        abilityToAdaptToVarietyOfTasks: 9,
        timeManagementDeadlineCompliance: 10,
        behavedInProfessionalManner: 10,
        effectivelyPerformedAssignments: 9,
        oralWrittenCommunicationSkills: 9,
        overallRating: 9.3,
        wouldRecommend: true,
        recommendation: "Outstanding intern! Exceeded all expectations. Highly recommended for any technical role.",
        position: "Full Stack Developer Intern",
        submittedAt: new Date('2025-09-08')
      }
    ];

    // Delete existing test evaluations
    await InterneeEvaluation.deleteMany({});
    console.log('🗑️ Cleared existing evaluations');

    // Insert new evaluations
    const createdEvaluations = await InterneeEvaluation.insertMany(testEvaluations);
    console.log(`✅ Created ${createdEvaluations.length} test company evaluations`);

    // Display created evaluations
    createdEvaluations.forEach((evaluation, index) => {
      console.log(`\n--- Evaluation ${index + 1} ---`);
      console.log('Student:', evaluation.studentName);
      console.log('Email:', evaluation.studentEmail);
      console.log('Registration:', evaluation.registrationNumber);
      console.log('Company:', evaluation.companyName);
      console.log('Position:', evaluation.position);
      console.log('Overall Rating:', evaluation.overallRating);
      console.log('Would Recommend:', evaluation.wouldRecommend ? 'Yes' : 'No');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

createSimpleTestData();
