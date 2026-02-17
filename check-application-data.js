const mongoose = require('mongoose');
require('dotenv').config();

async function checkApplicationData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const Application = require('./models/Application');
    const User = require('./models/User'); // Import User model for populate to work
    
    // Find hired application - get fresh data
    const app = await Application.findOne({ 
      studentId: '68c1689a6909d193253ba601',
      applicationStatus: 'hired'
    }).populate('companyId');
    
    if (app) {
      console.log('✅ Found application:', {
        id: app._id,
        studentId: app.studentId,
        companyId: app.companyId ? app.companyId._id : 'No company',
        companyName: app.companyId ? app.companyId.companyName : app.companyName,
        status: app.status,
        applicationStatus: app.applicationStatus,
        isCurrentlyHired: app.isCurrentlyHired,
        startDate: app.startDate,
        endDate: app.endDate,
        hiringDate: app.hiringDate,
        overallStatus: app.overallStatus
      });
      
      console.log('\n📋 Date-related fields:');
      const dateFields = ['startDate', 'endDate', 'hiringDate', 'appliedAt', 'supervisorReviewedAt', 'companyReviewedAt'];
      dateFields.forEach(field => {
        if (app[field]) {
          console.log(`  ${field}: ${app[field]}`);
        } else {
          console.log(`  ${field}: NOT SET`);
        }
      });
    } else {
      console.log('❌ No hired application found');
      
      // Check all applications for this student
      const allApps = await Application.find({ studentId: '68c1689a6909d193253ba601' });
      console.log(`Found ${allApps.length} applications total:`);
      allApps.forEach((app, index) => {
        console.log(`  ${index + 1}. Status: ${app.status}, AppStatus: ${app.applicationStatus}, Hired: ${app.isCurrentlyHired}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkApplicationData();
