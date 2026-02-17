require('dotenv').config();
const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');
const ProgressReport = require('./models/ProgressReport');
const InternshipAppraisal = require('./models/InternshipAppraisal');
const User = require('./models/User');

async function checkReportData() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check Progress Reports
    console.log('=== PROGRESS REPORTS ===');
    const progressReports = await ProgressReport.find().limit(5);
    
    for (const report of progressReports) {
      console.log('\n📄 Progress Report:');
      console.log('  Report ID:', report._id);
      console.log('  Stored Company Name:', report.companyName);
      console.log('  Company ID:', report.companyId);
      
      // Look up the actual company profile
      const companyProfile = await CompanyProfile.findOne({ userId: report.companyId });
      if (companyProfile) {
        console.log('  ✅ Company Profile Found:');
        console.log('     Organization Name:', companyProfile.organizationName);
        console.log('     Company Name (old):', companyProfile.companyName);
      } else {
        console.log('  ❌ No Company Profile Found');
        
        // Check if user exists
        const user = await User.findById(report.companyId);
        if (user) {
          console.log('  👤 User Name:', user.name);
        }
      }
      console.log('  ---');
    }
    
    // Check Internship Appraisals
    console.log('\n\n=== INTERNSHIP APPRAISALS ===');
    const appraisals = await InternshipAppraisal.find().limit(5);
    
    for (const appraisal of appraisals) {
      console.log('\n⭐ Appraisal:');
      console.log('  Appraisal ID:', appraisal._id);
      console.log('  Stored Company Name:', appraisal.companyName);
      console.log('  Company ID:', appraisal.companyId);
      
      // Look up the actual company profile
      const companyProfile = await CompanyProfile.findOne({ userId: appraisal.companyId });
      if (companyProfile) {
        console.log('  ✅ Company Profile Found:');
        console.log('     Organization Name:', companyProfile.organizationName);
        console.log('     Company Name (old):', companyProfile.companyName);
      } else {
        console.log('  ❌ No Company Profile Found');
        
        // Check if user exists
        const user = await User.findById(appraisal.companyId);
        if (user) {
          console.log('  👤 User Name:', user.name);
        }
      }
      console.log('  ---');
    }
    
    // Check all Company Profiles
    console.log('\n\n=== ALL COMPANY PROFILES ===');
    const allProfiles = await CompanyProfile.find();
    console.log(`Total Company Profiles: ${allProfiles.length}\n`);
    
    for (const profile of allProfiles) {
      console.log('Company Profile:');
      console.log('  User ID:', profile.userId);
      console.log('  Organization Name:', profile.organizationName);
      console.log('  Company Name (old field):', profile.companyName);
      console.log('  Status:', profile.status);
      console.log('  ---');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkReportData();
