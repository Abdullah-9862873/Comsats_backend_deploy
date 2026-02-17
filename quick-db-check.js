const mongoose = require('mongoose');
require('dotenv').config();

async function quickDBCheck() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check what collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Available Collections:');
    collections.forEach(col => console.log('  -', col.name));

    // Check users
    const User = require('./models/User');
    const students = await User.find({ role: 'student' });
    const supervisors = await User.find({ role: 'supervisor' });
    const companies = await User.find({ role: 'company' });
    
    console.log(`\n👥 Users: ${students.length} students, ${supervisors.length} supervisors, ${companies.length} companies`);
    
    if (students.length > 0) {
      console.log('📝 Sample student:', {
        name: students[0].name,
        email: students[0].email,
        registrationNumber: students[0].registrationNumber
      });
    }

    // Check evaluations
    const InterneeEvaluation = require('./models/InterneeEvaluation');
    const evaluations = await InterneeEvaluation.find();
    console.log(`\n📊 Evaluations in DB: ${evaluations.length}`);

    if (evaluations.length > 0) {
      console.log('📝 Sample evaluation structure:', {
        internId: evaluations[0].internId,
        companyId: evaluations[0].companyId,
        hasEvaluationData: !!evaluations[0].evaluation,
        submittedAt: evaluations[0].submittedAt
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

quickDBCheck();
