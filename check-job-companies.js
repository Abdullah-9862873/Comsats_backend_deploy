require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');

async function checkJobs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const jobs = await Job.find().limit(5);
    console.log(`\nFound ${jobs.length} jobs:`);
    
    jobs.forEach((job, i) => {
      console.log(`${i+1}. ${job.jobTitle}`);
      console.log(`   Company Name: "${job.companyName}"`);
      console.log(`   Company ID: ${job.companyId}`);
      console.log(`   Created: ${job.createdAt}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkJobs();