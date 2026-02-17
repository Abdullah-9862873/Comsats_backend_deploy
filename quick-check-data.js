const mongoose = require('mongoose');
require('dotenv').config();

async function quickCheck() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Quick check of data...');
    
    // Check applications
    const Application = require('./models/Application');
    const apps = await Application.find({ overallStatus: 'approved' }).limit(1);
    
    if (apps.length > 0) {
      console.log('Sample application:');
      console.log('- JobTitle:', apps[0].jobTitle);
      console.log('- StudentId:', apps[0].studentId);
      console.log('- CompanyId:', apps[0].companyId);
    }
    
    // Check users
    const User = require('./models/User');
    const users = await User.find({ role: 'student' }).limit(1);
    
    if (users.length > 0) {
      console.log('Sample student user:');
      console.log('- Name:', users[0].name);
      console.log('- Student.regNo:', users[0].student?.regNo);
      console.log('- Student.department:', users[0].student?.department);
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

quickCheck();
