const mongoose = require('mongoose');
require('dotenv').config();

const checkDetailedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const studentId = '68c1689a6909d193253ba601';
    
    // Import models
    const User = require('./models/User');
    const Application = require('./models/Application');
    const InternshipReport = require('./models/InternshipReport');
    
    // Check applications with details
    const applications = await Application.find({ studentId });
    console.log('\n=== APPLICATIONS ===');
    applications.forEach((app, index) => {
      console.log(`Application ${index + 1}:`);
      console.log(`  Status: ${app.status}`);
      console.log(`  Has Supervisor: ${app.supervisorId ? 'Yes' : 'No'}`);
      console.log(`  Start Date: ${app.startDate || 'Not set'}`);
      console.log(`  End Date: ${app.endDate || 'Not set'}`);
      console.log('');
    });
    
    // Check internship report with details
    const reports = await InternshipReport.find({ studentId });
    console.log('=== INTERNSHIP REPORTS ===');
    reports.forEach((report, index) => {
      console.log(`Report ${index + 1}:`);
      console.log(`  Status: ${report.status}`);
      console.log(`  Submitted: ${report.submittedAt || 'Not submitted'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDetailedData();
