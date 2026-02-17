const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');
const Job = require('./models/Job');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

async function checkRealCompanies() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all company profiles
    console.log('\n📋 Checking existing Company Profiles...');
    const companies = await CompanyProfile.find({}).populate('user', 'name email');
    
    console.log(`Found ${companies.length} companies in CompanyProfile collection:`);
    
    companies.forEach((company, index) => {
      console.log(`\n--- Company ${index + 1} ---`);
      console.log(`Company Name: ${company.companyName}`);
      console.log(`Industry: ${company.industry}`);
      console.log(`Location: ${company.location}`);
      console.log(`Company Size: ${company.companySize}`);
      console.log(`Profile Completeness: ${company.profileCompleteness}%`);
      console.log(`Website: ${company.website}`);
      console.log(`Description: ${company.description?.substring(0, 100)}...`);
      console.log(`User Email: ${company.user?.email}`);
      console.log(`Created: ${company.createdAt}`);
      console.log(`Logo: ${company.logoImage ? 'Yes' : 'No'}`);
      console.log(`Banner: ${company.bannerImage ? 'Yes' : 'No'}`);
    });

    // Check for jobs posted by these companies
    console.log('\n💼 Checking Jobs posted by these companies...');
    for (let company of companies) {
      const jobs = await Job.find({ companyId: company.user }).populate('companyId', 'name email');
      console.log(`\n${company.companyName} has ${jobs.length} jobs:`);
      jobs.forEach(job => {
        console.log(`  - ${job.jobTitle} (${job.status}) - ${job.location} - ${job.workType}`);
      });
    }

    // Check users with company role
    console.log('\n👥 Checking Users with company role...');
    const companyUsers = await User.find({ role: 'company' });
    console.log(`Found ${companyUsers.length} users with company role:`);
    companyUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkRealCompanies();
