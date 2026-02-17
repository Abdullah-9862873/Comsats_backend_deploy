const mongoose = require('mongoose');
require('dotenv').config();

async function addInternshipDates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const Application = require('./models/Application');
    
    // Find the hired application
    const app = await Application.findOne({ 
      studentId: '68c1689a6909d193253ba601',
      applicationStatus: 'hired'
    });
    
    if (app) {
      // Add internship dates (3 months internship that has ended)
      app.startDate = new Date('2024-06-01'); // Past start date
      app.endDate = new Date('2024-08-31'); // Past end date
      app.department = 'Software Development';
      app.jobPosition = 'Software Engineer Intern';
      
      await app.save();
      console.log('✅ Added internship dates and details to application:', {
        id: app._id,
        startDate: app.startDate,
        endDate: app.endDate,
        department: app.department,
        jobPosition: app.jobPosition
      });
    } else {
      console.log('❌ No hired application found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

addInternshipDates();
