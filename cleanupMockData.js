const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');
const Job = require('./models/Job');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

async function cleanupMockData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find and delete mock companies (those with specific email patterns or low profile completion)
    console.log('\n🧹 Cleaning up mock data...');
    
    // Mock companies have these emails:
    const mockEmails = [
      'ahmed.khan@techcorp.com',
      'fatima.ali@greenenergy.com', 
      'sarah.ahmed@healthcareinnovations.com',
      'hassan.malik@fintech.com',
      'aisha.rahman@edutech.com'
    ];

    // First find the users with mock emails
    const mockUsers = await User.find({ email: { $in: mockEmails } });
    console.log(`Found ${mockUsers.length} mock users to delete`);

    // Find jobs posted by these mock companies
    const mockUserIds = mockUsers.map(user => user._id);
    const mockJobs = await Job.find({ companyId: { $in: mockUserIds } });
    console.log(`Found ${mockJobs.length} mock jobs to delete`);

    // Find company profiles linked to these mock users
    const mockCompanyProfiles = await CompanyProfile.find({ user: { $in: mockUserIds } });
    console.log(`Found ${mockCompanyProfiles.length} mock company profiles to delete`);

    // Delete jobs first
    if (mockJobs.length > 0) {
      await Job.deleteMany({ companyId: { $in: mockUserIds } });
      console.log(`✅ Deleted ${mockJobs.length} mock jobs`);
    }

    // Delete company profiles
    if (mockCompanyProfiles.length > 0) {
      await CompanyProfile.deleteMany({ user: { $in: mockUserIds } });
      console.log(`✅ Deleted ${mockCompanyProfiles.length} mock company profiles`);
    }

    // Delete mock users
    if (mockUsers.length > 0) {
      await User.deleteMany({ email: { $in: mockEmails } });
      console.log(`✅ Deleted ${mockUsers.length} mock users`);
    }

    // Show remaining real companies
    console.log('\n📋 Remaining real companies:');
    const realCompanies = await CompanyProfile.find({}).populate('user', 'name email');
    realCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.companyName} (${company.profileCompleteness}%) - ${company.user.email}`);
    });

    console.log('\n🎉 Mock data cleanup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanupMockData();
