require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');

async function testFrontendAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    // Exact simulation of what the frontend getAllJobs API would receive
    const jobs = await Job.find({ 
      status: 'Active',
      $expr: { $lt: ['$applicationsCount', '$applicationLimit'] }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('-__v')
    .populate('companyId', 'name companyName email');

    console.log('\n=== FRONTEND API SIMULATION ===');
    console.log(`Total jobs returned: ${jobs.length}`);
    
    const apiResponse = {
      success: true,
      data: jobs,
      pagination: {
        current: 1,
        pages: 1,
        total: jobs.length,
        limit: 10
      }
    };
    
    console.log('\n=== JOB DETAILS AS FRONTEND WOULD SEE ===');
    apiResponse.data.forEach((job, i) => {
      console.log(`\n${i+1}. JOB: ${job.jobTitle}`);
      console.log(`   job.companyName: "${job.companyName}"`);
      console.log(`   job.companyId: ${job.companyId ? `{name: "${job.companyId.name}", email: "${job.companyId.email}"}` : 'null'}`);
      
      // Frontend helper function simulation
      const resolvedName = job.companyName || 
                          job.companyId?.name || 
                          job.companyId?.companyName ||
                          'Unknown Company';
      console.log(`   RESOLVED NAME: "${resolvedName}"`);
      
      // Show what would appear in the UI
      console.log(`   🏢 UI will show: "${resolvedName}"`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFrontendAPI();