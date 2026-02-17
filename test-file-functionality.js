// Test script to verify file download and preview functionality
const mongoose = require('mongoose');
const Application = require('./models/Application');
require('dotenv').config();

const testFileHandling = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for testing');

    // Find a test application with student profile
    const applications = await Application.find({
      'studentProfile.cv.path': { $exists: true, $ne: null }
    }).limit(5);

    console.log(`Found ${applications.length} applications with CV uploads`);
    
    applications.forEach((app, index) => {
      console.log(`\nApplication ${index + 1}:`);
      console.log(`- ID: ${app._id}`);
      console.log(`- Student: ${app.studentName}`);
      console.log(`- CV File: ${app.studentProfile.cv?.originalName || 'No CV'}`);
      console.log(`- CV Path: ${app.studentProfile.cv?.path || 'No Path'}`);
      console.log(`- Certificates: ${app.studentProfile.certificates?.length || 0}`);
      
      if (app.studentProfile.certificates?.length > 0) {
        app.studentProfile.certificates.forEach((cert, i) => {
          console.log(`  - Certificate ${i + 1}: ${cert.originalName}`);
        });
      }
    });

    // Test URLs that can be used for download/preview
    if (applications.length > 0) {
      const testApp = applications[0];
      console.log('\n=== Test URLs ===');
      console.log(`Download CV: /api/applications/${testApp._id}/download/cv/${testApp.studentProfile.cv.filename}`);
      console.log(`Preview CV: /api/applications/${testApp._id}/preview/cv/${testApp.studentProfile.cv.filename}`);
      
      if (testApp.studentProfile.certificates?.length > 0) {
        const cert = testApp.studentProfile.certificates[0];
        console.log(`Download Certificate: /api/applications/${testApp._id}/download/certificate/${cert.filename}`);
        console.log(`Preview Certificate: /api/applications/${testApp._id}/preview/certificate/${cert.filename}`);
      }
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

// Run the test
testFileHandling();
