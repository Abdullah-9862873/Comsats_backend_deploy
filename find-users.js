const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function findUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with role 'student'
    const students = await User.find({ role: 'student' })
      .select('name email role')
      .limit(5)
      .lean();

    console.log(`📊 Found ${students.length} students`);

    if (students.length > 0) {
      console.log('\n👨‍🎓 Students in system:');
      students.forEach((student, index) => {
        console.log(`${index + 1}. Name: ${student.name}`);
        console.log(`   Email: ${student.email}`);
        console.log(`   Role: ${student.role}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findUsers();