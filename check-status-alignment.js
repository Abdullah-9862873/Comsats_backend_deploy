const mongoose = require('mongoose');
const Application = require('./models/Application');

async function checkStatuses() {
  try {
    await mongoose.connect('mongodb://localhost:27017/InternshipPlatform');
    
    console.log('Checking application statuses...');
    
    // Check applications with overallStatus approved
    const approvedApps = await Application.find({overallStatus: 'approved'});
    console.log('\nApplications with overallStatus approved:', approvedApps.length);
    
    // Check applications with applicationStatus hired
    const hiredApps = await Application.find({applicationStatus: 'hired'});
    console.log('Applications with applicationStatus hired:', hiredApps.length);
    
    // Check applications with BOTH
    const bothApps = await Application.find({
      overallStatus: 'approved',
      applicationStatus: 'hired'
    });
    console.log('Applications with BOTH overallStatus approved AND applicationStatus hired:', bothApps.length);
    
    if (approvedApps.length > 0) {
      console.log('\nSample approved application statuses:');
      approvedApps.slice(0, 3).forEach(app => {
        console.log(`- Application ${app._id}: overallStatus=${app.overallStatus}, applicationStatus=${app.applicationStatus}`);
      });
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStatuses();
