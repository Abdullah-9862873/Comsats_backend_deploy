const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const InterneeEvaluation = require('./models/InterneeEvaluation');

async function checkEvaluationData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const evaluations = await InterneeEvaluation.find().limit(5).lean();
    console.log('\n📋 Found evaluations:', evaluations.length);

    evaluations.forEach((eval, index) => {
      console.log(`\n--- Evaluation ${index + 1} ---`);
      console.log('ID:', eval._id);
      console.log('Student ID:', eval.studentId || eval.internId);
      console.log('Total Marks:', eval.evaluation?.totalMarks);
      console.log('Max Marks:', eval.evaluation?.maxMarks);
      console.log('Company ID:', eval.companyId);
      console.log('Application ID:', eval.applicationId);
      console.log('Evaluation keys:', Object.keys(eval.evaluation || {}));
      
      // Calculate percentage if available
      if (eval.evaluation?.totalMarks && eval.evaluation?.maxMarks) {
        const percentage = (eval.evaluation.totalMarks / eval.evaluation.maxMarks) * 100;
        console.log('Calculated Percentage:', percentage.toFixed(2) + '%');
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkEvaluationData();