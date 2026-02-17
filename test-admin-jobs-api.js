const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');
require('dotenv').config();

async function testAdminJobsAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 Testing Admin Jobs API Response Structure\n');

    // Simulate the same query used in adminController.js
    const filter = {};
    
    const jobs = await Job.find(filter)
      .populate({
        path: 'companyId',
        select: 'name email role company',
        populate: {
          path: 'company',
          model: 'CompanyProfile',
          select: 'companyName industry about website'
        }
      })
      .sort({ createdAt: -1 })
      .limit(5); // Limit to 5 for testing

    console.log(`📊 Found ${jobs.length} jobs`);

    if (jobs.length > 0) {
      jobs.forEach((job, index) => {
        console.log(`\n--- Job ${index + 1} ---`);
        console.log(`Job Title: ${job.jobTitle}`);
        console.log(`Direct companyName: ${job.companyName || 'Not set'}`);
        console.log(`CompanyId structure:`);
        console.log(`  - companyId._id: ${job.companyId?._id}`);
        console.log(`  - companyId.name: ${job.companyId?.name}`);
        console.log(`  - companyId.email: ${job.companyId?.email}`);
        console.log(`  - companyId.company: ${job.companyId?.company ? 'Present' : 'Not present'}`);
        
        if (job.companyId?.company) {
          console.log(`  - companyId.company.companyName: ${job.companyId.company.companyName}`);
          console.log(`  - companyId.company.industry: ${job.companyId.company.industry}`);
        }
        
        // Test the frontend access patterns
        console.log(`\nFrontend Access Tests:`);
        console.log(`  - job.companyName: ${job.companyName || 'undefined'}`);
        console.log(`  - job.companyId?.company?.companyName: ${job.companyId?.company?.companyName || 'undefined'}`);
        console.log(`  - job.companyId?.name: ${job.companyId?.name || 'undefined'}`);
        console.log(`  - job.companyId?.companyName: ${job.companyId?.companyName || 'undefined'}`);
        
        const displayName = job.companyName || job.companyId?.company?.companyName || job.companyId?.name || 'N/A';
        console.log(`  - Final display name: "${displayName}"`);
      });
    } else {
      console.log('❌ No jobs found in database');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAdminJobsAPI();