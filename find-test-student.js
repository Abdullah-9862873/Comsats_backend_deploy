const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Application = require('./models/Application');

async function findTestStudent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find students with approved applications
    const approvedApplications = await Application.find({ overallStatus: 'approved' })
      .populate('studentId', 'email name _id')
      .limit(3)
      .lean();

    console.log(`📊 Found ${approvedApplications.length} approved applications`);

    if (approvedApplications.length > 0) {
      console.log('\n👨‍🎓 Students with approved applications:');
      approvedApplications.forEach((app, index) => {
        console.log(`${index + 1}. Name: ${app.studentId.name}`);
        console.log(`   Email: ${app.studentId.email}`);
        console.log(`   Company: ${app.companyName}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findTestStudent();