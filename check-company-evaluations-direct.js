const mongoose = require('mongoose');
require('dotenv').config();

// Import the InterneeEvaluation model
const InterneeEvaluation = require('./models/InterneeEvaluation');

async function checkCompanyEvaluations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check company evaluations
    const evaluations = await InterneeEvaluation.find()
      .populate('studentId', 'name email registrationNumber')
      .populate('companyId', 'companyName')
      .limit(10);

    console.log(`📊 Total company evaluations found: ${evaluations.length}`);

    if (evaluations.length > 0) {
      console.log('\n📝 Sample evaluation data:');
      evaluations.forEach((eval, index) => {
        console.log(`\n--- Evaluation ${index + 1} ---`);
        console.log('Student:', eval.studentId?.name || 'Unknown');
        console.log('Email:', eval.studentId?.email || 'N/A');
        console.log('Registration:', eval.studentId?.registrationNumber || 'N/A');
        console.log('Company:', eval.companyId?.companyName || 'Unknown Company');
        console.log('Overall Rating:', eval.overallRating || 'N/A');
        console.log('Submitted At:', eval.submittedAt || eval.createdAt);
        console.log('---');
      });
    } else {
      console.log('⚠️ No company evaluations found in database');
      
      // Let's also check the structure of the collection
      const sampleData = await InterneeEvaluation.findOne();
      if (sampleData) {
        console.log('\n📋 Sample document structure:');
        console.log(Object.keys(sampleData.toObject()));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 Disconnected from MongoDB');
  }
}

checkCompanyEvaluations();
