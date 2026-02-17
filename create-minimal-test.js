const mongoose = require('mongoose');
require('dotenv').config();

async function createMinimalTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const InterneeEvaluation = require('./models/InterneeEvaluation');
    
    // Check if any evaluations exist
    const existingCount = await InterneeEvaluation.countDocuments();
    console.log(`Current evaluations: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('✅ Evaluations already exist');
      await mongoose.disconnect();
      return;
    }
    
    // Get user and application IDs from database
    const User = require('./models/User');
    const Application = require('./models/Application');
    
    const students = await User.find({ role: 'student' }).limit(1);
    const companies = await User.find({ role: 'company' }).limit(1);
    
    if (students.length === 0 || companies.length === 0) {
      console.log('❌ Need at least one student and one company');
      await mongoose.disconnect();
      return;
    }
    
    // Create a minimal evaluation for testing
    const testEvaluation = new InterneeEvaluation({
      internId: students[0]._id,
      companyId: companies[0]._id,
      applicationId: new mongoose.Types.ObjectId(), // Dummy application ID
      evaluation: {
        punctualityAndAttendance: 4,
        abilityToLinkTheoryToPractice: 3,
        demonstratedCriticalThinking: 4,
        technicalKnowledge: 4,
        creativityConceptualAbility: 3,
        abilityToAdaptToVarietyOfTasks: 4,
        timeManagementDeadlineCompliance: 4,
        behavedInProfessionalManner: 4,
        effectivelyPerformedAssignments: 3,
        oralWrittenCommunicationSkills: 4,
        totalMarks: 37,
        maxMarks: 40,
        supervisorComments: 'Excellent performance overall. Highly recommended!'
      }
    });
    
    await testEvaluation.save();
    console.log('✅ Created test evaluation');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createMinimalTestData();
