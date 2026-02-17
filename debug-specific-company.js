const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Job = require('./models/Job');
require('dotenv').config();

async function debugSpecificCompany() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('=== DEBUGGING SPECIFIC COMPANY APPRAISAL ISSUE ===');
    
    // This is the company ID from the error logs
    const companyUserId = "68ce61622faa3e9026187e8f";
    
    console.log('Debugging company ID:', companyUserId);
    
    // Find all hired applications for this company
    const hiredApplications = await Application.find({
      companyId: companyUserId,
      applicationStatus: 'hired'
    });

    console.log('Raw hired applications (before populate):', hiredApplications.length);
    
    // Check each application's data
    for (let i = 0; i < hiredApplications.length; i++) {
      const app = hiredApplications[i];
      console.log(`\nApp ${i + 1}:`);
      console.log('  App ID:', app._id);
      console.log('  Student ID:', app.studentId);
      console.log('  Job ID:', app.jobId);
      
      // Check if student exists
      if (app.studentId) {
        const student = await User.findById(app.studentId);
        console.log('  Student exists in DB:', student ? 'Yes' : 'No');
        if (student) {
          console.log('  Student name:', student.name);
        } else {
          console.log('  ❌ PROBLEM: Student ID exists in app but student not found in User collection!');
        }
      } else {
        console.log('  ❌ PROBLEM: Student ID is null/undefined in application!');
      }
      
      // Check if job exists
      if (app.jobId) {
        const job = await Job.findById(app.jobId);
        console.log('  Job exists in DB:', job ? 'Yes' : 'No');
        if (job) {
          console.log('  Job title:', job.title);
        }
      }
    }
    
    // Now try the populate
    console.log('\n=== TESTING POPULATE ===');
    const populatedApps = await Application.find({
      companyId: companyUserId,
      applicationStatus: 'hired'
    })
    .populate('studentId', 'name email student.regNo')
    .populate('jobId', 'title duration')
    .sort({ updatedAt: -1 });

    console.log('Populated applications:', populatedApps.length);
    
    populatedApps.forEach((app, index) => {
      console.log(`\nPopulated App ${index + 1}:`);
      console.log('  Student populated:', app.studentId ? 'Yes' : 'No');
      console.log('  Job populated:', app.jobId ? 'Yes' : 'No');
      
      if (!app.studentId) {
        console.log('  ❌ NULL STUDENT - This would cause the error!');
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugSpecificCompany();