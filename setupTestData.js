const mongoose = require('mongoose');
require('dotenv').config();

const setupTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const studentId = '68c1689a6909d193253ba601';
    
    // Import models
    const User = require('./models/User');
    const Application = require('./models/Application');
    const InternshipReport = require('./models/InternshipReport');
    
    // Update one application to have "hired" status with dates
    const application = await Application.findOne({ studentId });
    if (application) {
      application.status = 'hired';
      application.startDate = new Date('2024-06-01'); // Past start date
      application.endDate = new Date('2024-08-31'); // Past end date (3 months internship)
      await application.save();
      console.log('✅ Updated application status to "hired" with dates');
    } else {
      console.log('❌ No application found to update');
    }
    
    // Update internship report status to "approved"
    const report = await InternshipReport.findOne({ studentId });
    if (report) {
      report.status = 'approved';
      await report.save();
      console.log('✅ Updated internship report status to "approved"');
    } else {
      console.log('❌ No internship report found to update');
    }
    
    console.log('🎉 Test data setup complete!');
    console.log('Student should now be eligible for completion certificate submission.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

setupTestData();
