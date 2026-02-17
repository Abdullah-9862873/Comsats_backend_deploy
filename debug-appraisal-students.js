const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('=== DEBUGGING APPRAISAL ELIGIBLE STUDENTS ===');
    
    // Check hired applications
    console.log('\n1. Checking hired applications...');
    const hiredApps = await Application.find({ applicationStatus: 'hired' });
    console.log('Total hired applications:', hiredApps.length);
    
    if (hiredApps.length > 0) {
      console.log('\nFirst few hired applications:');
      for (let i = 0; i < Math.min(3, hiredApps.length); i++) {
        const app = hiredApps[i];
        console.log(`App ${i + 1}:`);
        console.log('  App ID:', app._id);
        console.log('  Company ID:', app.companyId);
        console.log('  Student ID:', app.studentId);
        console.log('  Job ID:', app.jobId);
        console.log('  Status:', app.applicationStatus);
        
        // Check if student exists
        if (app.studentId) {
          const student = await User.findById(app.studentId);
          console.log('  Student exists:', student ? 'Yes' : 'No');
          if (student) {
            console.log('  Student name:', student.name);
          }
        }
        console.log('---');
      }
      
      // Try the populate that's failing
      console.log('\n2. Testing populate...');
      const populatedApps = await Application.find({ applicationStatus: 'hired' })
        .populate('studentId', 'name email student.regNo')
        .populate('jobId', 'title duration');
      
      console.log('Populated applications count:', populatedApps.length);
      
      populatedApps.forEach((app, index) => {
        if (index < 3) { // Show first 3
          console.log(`Populated App ${index + 1}:`);
          console.log('  Student populated:', app.studentId ? 'Yes' : 'No');
          console.log('  Job populated:', app.jobId ? 'Yes' : 'No');
          if (app.studentId) {
            console.log('  Student name:', app.studentId.name);
          }
        }
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();