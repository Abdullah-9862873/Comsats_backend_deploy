const mongoose = require('mongoose');
const InterneeEvaluation = require('./models/InterneeEvaluation');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal';

async function checkEvaluations() {
    try {
        await mongoose.connect(mongoURI);
        console.log('🔗 Connected to MongoDB');

        // Find Company_1
        const company = await User.findOne({ username: 'Company_1', role: 'company' });
        console.log('\n📊 Company_1 ID:', company._id);

        // Check existing evaluations
        const evaluations = await InterneeEvaluation.find({ companyId: company._id });
        console.log(`\n📋 Existing Evaluations: ${evaluations.length}`);
        
        evaluations.forEach((eval, index) => {
            console.log(`${index + 1}. Intern: ${eval.internId}, Application: ${eval.applicationId}`);
            console.log(`   Total Marks: ${eval.evaluation?.totalMarks}/${eval.evaluation?.maxMarks}`);
            console.log(`   Submitted: ${eval.submittedAt}`);
        });

        // Delete all existing evaluations to allow resubmission
        if (evaluations.length > 0) {
            const deleteResult = await InterneeEvaluation.deleteMany({ companyId: company._id });
            console.log('\n🗑️ Deleted evaluations:', deleteResult.deletedCount);
        }

        await mongoose.disconnect();
        console.log('\n🔚 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
    }
}

checkEvaluations();
