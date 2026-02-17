const mongoose = require('mongoose');
require('dotenv').config();
const Application = require('./models/Application');
const User = require('./models/User');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find approved applications
    console.log('\n📋 Checking approved applications...');
    const applications = await Application.find({
      overallStatus: 'approved'
    }).populate('studentId', 'name email registrationNumber department student')
      .populate('companyId', 'name email company')
      .populate('jobId', 'title');
    
    console.log(`Found ${applications.length} approved applications:`);
    
    applications.forEach((app, index) => {
      console.log(`\n--- Application ${index + 1} ---`);
      console.log('Student Name:', app.studentId?.name);
      console.log('Student Email:', app.studentId?.email);
      console.log('Registration Number:', app.studentId?.registrationNumber);
      console.log('Student.regNo:', app.studentId?.student?.regNo);
      console.log('Department:', app.studentId?.department);
      console.log('Student.department:', app.studentId?.student?.department);
      console.log('Job Title (app.jobTitle):', app.jobTitle);
      console.log('Job Title (jobId.title):', app.jobId?.title);
      console.log('Company Name:', app.companyId?.company?.companyName || app.companyId?.name);
    });
    
    // Also check a specific user to see their structure
    console.log('\n👤 Checking user structure...');
    const sampleUser = await User.findOne({ role: 'student' });
    if (sampleUser) {
      console.log('Sample student user:');
      console.log('Name:', sampleUser.name);
      console.log('Email:', sampleUser.email);
      console.log('Student.regNo:', sampleUser.student?.regNo);
      console.log('Student.department:', sampleUser.student?.department);
      console.log('Student.semester:', sampleUser.student?.semester);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkData();
