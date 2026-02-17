require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');

async function searchTechPro() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    // Search for Tech Pro jobs
    const techProJobs = await Job.find({
      companyName: { $regex: 'Tech Pro', $options: 'i' }
    });
    
    console.log(`\nJobs with "Tech Pro": ${techProJobs.length}`);
    techProJobs.forEach(job => {
      console.log(`- ${job.jobTitle} by ${job.companyName}`);
    });
    
    // Search for Tech* jobs
    const techJobs = await Job.find({
      companyName: { $regex: 'Tech', $options: 'i' }
    });
    
    console.log(`\nJobs with "Tech": ${techJobs.length}`);
    techJobs.forEach(job => {
      console.log(`- ${job.jobTitle} by ${job.companyName}`);
    });
    
    // Check all unique company names
    const allCompanies = await Job.distinct('companyName');
    console.log('\nAll company names in database:');
    allCompanies.forEach(name => console.log(`- ${name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

searchTechPro();