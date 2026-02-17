require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');

const app = express();

async function testAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    // Simulate the exact same query as the frontend
    const jobs = await Job.find({ 
      status: 'Active',
      $expr: { $lt: ['$applicationsCount', '$applicationLimit'] }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('-__v')
    .populate('companyId', 'name companyName email');

    console.log(`\nFound ${jobs.length} jobs via API simulation:`);
    
    jobs.forEach((job, i) => {
      console.log(`\n${i+1}. ${job.jobTitle}`);
      console.log(`   Direct companyName: "${job.companyName}"`);
      console.log(`   Populated companyId: ${job.companyId ? JSON.stringify(job.companyId) : 'null'}`);
      
      // Simulate the frontend logic
      const resolvedName = job.companyName || 
                          job.companyId?.name || 
                          job.companyId?.companyName ||
                          'Unknown Company';
      console.log(`   Resolved name: "${resolvedName}"`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAPI();