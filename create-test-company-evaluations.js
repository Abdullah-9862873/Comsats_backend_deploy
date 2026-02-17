const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const InterneeEvaluation = require('./models/InterneeEvaluation');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');

async function createTestCompanyEvaluations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get some students and companies
    const students = await User.find({ role: 'student' }).limit(3);
    const companies = await CompanyProfile.find().limit(2);

    console.log(`Found ${students.length} students and ${companies.length} companies`);

    if (students.length === 0 || companies.length === 0) {
      console.log('⚠️ Need students and companies in database first');
      return;
    }

    // Create test company evaluations
    const testEvaluations = [
      {
        studentId: students[0]._id,
        companyId: companies[0]._id,
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
        companyId: companies[0]._id,
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
        studentId: students[2]._id,
        companyId: companies.length > 1 ? companies[1]._id : companies[0]._id,
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
    for (let i = 0; i < createdEvaluations.length; i++) {
      const evaluation = await InterneeEvaluation.findById(createdEvaluations[i]._id)
        .populate('studentId', 'name email registrationNumber')
        .populate('companyId', 'companyName');
      
      console.log(`\n--- Evaluation ${i + 1} ---`);
      console.log('Student:', evaluation.studentId?.name);
      console.log('Email:', evaluation.studentId?.email);
      console.log('Registration:', evaluation.studentId?.registrationNumber);
      console.log('Company:', evaluation.companyId?.companyName);
      console.log('Position:', evaluation.position);
      console.log('Overall Rating:', evaluation.overallRating);
      console.log('Would Recommend:', evaluation.wouldRecommend ? 'Yes' : 'No');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

createTestCompanyEvaluations();
