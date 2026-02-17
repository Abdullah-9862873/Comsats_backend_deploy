const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect('mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // Import Application model
    const Application = require('./models/Application');
    
    console.log('Checking application statuses...');
    
    // Check applications with overallStatus approved
    const approvedApps = await Application.find({overallStatus: 'approved'});
    console.log(`\nApplications with overallStatus 'approved': ${approvedApps.length}`);
    
    // Check applications with applicationStatus hired
    const hiredApps = await Application.find({applicationStatus: 'hired'});
    console.log(`Applications with applicationStatus 'hired': ${hiredApps.length}`);
    
    // Check applications with BOTH
    const bothApps = await Application.find({
      overallStatus: 'approved',
      applicationStatus: 'hired'
    });
    console.log(`Applications with BOTH overallStatus 'approved' AND applicationStatus 'hired': ${bothApps.length}`);
    
    if (approvedApps.length > 0) {
      console.log('\nSample approved application statuses:');
      approvedApps.slice(0, 3).forEach(app => {
        console.log(`- Application ${app._id}: overallStatus=${app.overallStatus}, applicationStatus=${app.applicationStatus || 'undefined'}`);
      });
    }
    
    if (hiredApps.length > 0 && hiredApps.length !== approvedApps.length) {
      console.log('\nSample hired application statuses:');
      hiredApps.slice(0, 3).forEach(app => {
        console.log(`- Application ${app._id}: overallStatus=${app.overallStatus || 'undefined'}, applicationStatus=${app.applicationStatus}`);
      });
    }
    
    console.log('\n🔍 This explains the issue:');
    console.log(`- Evaluation tab looks for overallStatus='approved': ${approvedApps.length} found`);
    console.log(`- Hiring process sets applicationStatus='hired': ${hiredApps.length} found`);
    console.log(`- Applications with BOTH statuses: ${bothApps.length} found`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();
