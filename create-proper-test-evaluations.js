const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const InterneeEvaluation = require('./models/InterneeEvaluation');
const User = require('./models/User');
const Application = require('./models/Application');

async function createProperTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get students, supervisors, and companies
    const students = await User.find({ role: 'student' }).limit(3);
    const companies = await User.find({ role: 'company' }).limit(2);
    const supervisors = await User.find({ role: 'supervisor' }).limit(1);

    console.log(`Found ${students.length} students, ${companies.length} companies, ${supervisors.length} supervisors`);

    if (students.length === 0 || companies.length === 0 || supervisors.length === 0) {
      console.log('⚠️ Need students, companies, and supervisors in database first');
      return;
    }

    // First, let's check if there are approved applications
    const approvedApps = await Application.find({
      overallStatus: 'approved',
      supervisorId: supervisors[0]._id
    }).limit(3);

    console.log(`Found ${approvedApps.length} approved applications`);

    // Create test applications if none exist
    let applicationsToUse = approvedApps;
    if (approvedApps.length === 0) {
      console.log('Creating test applications...');
      const testApplications = [
        {
          studentId: students[0]._id,
          companyId: companies[0]._id,
          supervisorId: supervisors[0]._id,
          jobTitle: 'Software Engineer Intern',
          studentName: students[0].name,
          studentEmail: students[0].email,
          registrationNumber: students[0].registrationNumber,
          overallStatus: 'approved',
          createdAt: new Date('2025-09-01')
        },
        {
          studentId: students[1]._id,
          companyId: companies[0]._id,
          supervisorId: supervisors[0]._id,
          jobTitle: 'Data Analyst Intern',
          studentName: students[1].name,
          studentEmail: students[1].email,
          registrationNumber: students[1].registrationNumber,
          overallStatus: 'approved',
          createdAt: new Date('2025-09-02')
        }
      ];

      if (students.length > 2 && companies.length > 1) {
        testApplications.push({
          studentId: students[2]._id,
          companyId: companies[1]._id,
          supervisorId: supervisors[0]._id,
          jobTitle: 'Full Stack Developer Intern',
          studentName: students[2].name,
          studentEmail: students[2].email,
          registrationNumber: students[2].registrationNumber,
          overallStatus: 'approved',
          createdAt: new Date('2025-09-03')
        });
      }

      applicationsToUse = await Application.insertMany(testApplications);
      console.log(`✅ Created ${applicationsToUse.length} test applications`);
    }

    // Delete existing evaluations
    await InterneeEvaluation.deleteMany({});
    console.log('🗑️ Cleared existing evaluations');

    // Create proper internee evaluations with correct structure
    const testEvaluations = applicationsToUse.map((application, index) => {
      const ratings = [
        [4, 4, 3, 4, 3, 4, 4, 4, 4, 3], // Good performance
        [3, 3, 3, 3, 4, 3, 3, 4, 3, 3], // Average performance
        [4, 4, 4, 4, 4, 4, 4, 4, 4, 4]  // Excellent performance
      ];

      const currentRatings = ratings[index] || ratings[0];
      const totalMarks = currentRatings.reduce((sum, rating) => sum + rating, 0);

      return {
        internId: application.studentId,
        companyId: application.companyId,
        applicationId: application._id,
        evaluation: {
          punctualityAndAttendance: currentRatings[0],
          abilityToLinkTheoryToPractice: currentRatings[1],
          demonstratedCriticalThinking: currentRatings[2],
          technicalKnowledge: currentRatings[3],
          creativityConceptualAbility: currentRatings[4],
          abilityToAdaptToVarietyOfTasks: currentRatings[5],
          timeManagementDeadlineCompliance: currentRatings[6],
          behavedInProfessionalManner: currentRatings[7],
          effectivelyPerformedAssignments: currentRatings[8],
          oralWrittenCommunicationSkills: currentRatings[9],
          totalMarks: totalMarks,
          maxMarks: 40,
          supervisorComments: [
            'Excellent intern with strong technical skills and professional attitude.',
            'Good performance overall. Shows potential for growth with more experience.',
            'Outstanding intern! Exceeded all expectations. Highly recommended.'
          ][index] || 'Good performance.'
        },
        submittedAt: new Date(`2025-09-0${8 + index}`)
      };
    });

    // Insert evaluations
    const createdEvaluations = await InterneeEvaluation.insertMany(testEvaluations);
    console.log(`✅ Created ${createdEvaluations.length} test company evaluations`);

    // Display what was created
    for (let i = 0; i < createdEvaluations.length; i++) {
      const evaluation = await InterneeEvaluation.findById(createdEvaluations[i]._id)
        .populate('internId', 'name email registrationNumber')
        .populate('companyId', 'name email company')
        .populate('applicationId', 'jobTitle studentName studentEmail');
      
      console.log(`\n--- Evaluation ${i + 1} ---`);
      console.log('Student:', evaluation.internId?.name || evaluation.applicationId?.studentName);
      console.log('Email:', evaluation.internId?.email || evaluation.applicationId?.studentEmail);
      console.log('Registration:', evaluation.internId?.registrationNumber);
      console.log('Company:', evaluation.companyId?.company?.companyName || evaluation.companyId?.name);
      console.log('Position:', evaluation.applicationId?.jobTitle);
      console.log('Total Marks:', evaluation.evaluation.totalMarks, '/ 40');
      console.log('Comments:', evaluation.evaluation.supervisorComments);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

createProperTestData();
