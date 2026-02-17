const mongoose = require('mongoose');
const Job = require('./models/Job');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');

const fixJobCompanyNames = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');

    // Find all jobs
    const jobs = await Job.find({});
    console.log(`📋 Found ${jobs.length} jobs to check`);

    let updatedCount = 0;

    for (const job of jobs) {
      try {
        // Find the company profile for this job
        const companyProfile = await CompanyProfile.findOne({ user: job.companyId });
        
        if (companyProfile && companyProfile.companyName && job.companyName !== companyProfile.companyName) {
          console.log(`🔄 Updating job "${job.jobTitle}"`);
          console.log(`   Old company name: "${job.companyName}"`);
          console.log(`   New company name: "${companyProfile.companyName}"`);
          
          // Update the job with correct company name
          await Job.findByIdAndUpdate(job._id, { 
            companyName: companyProfile.companyName 
          });
          
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating job ${job._id}:`, error.message);
      }
    }

    console.log(`✅ Fixed ${updatedCount} jobs with incorrect company names`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

fixJobCompanyNames();