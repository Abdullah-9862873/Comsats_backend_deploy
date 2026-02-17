require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');

async function testUserDetailsAPI() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    // Find a company user
    const companyUser = await User.findOne({ role: 'company' }).select('_id name email role');
    
    if (companyUser) {
      console.log(`\n📧 Testing with company user: ${companyUser.email}`);
      console.log(`👤 Name: ${companyUser.name}`);
      console.log(`🆔 ID: ${companyUser._id}`);
      
      // Fetch company profile
      const companyProfile = await CompanyProfile.findOne({ user: companyUser._id });
      
      if (companyProfile) {
        console.log('\n🏢 Company Profile found:');
        console.log(`   Company Name: ${companyProfile.companyName}`);
        console.log(`   Industry: ${companyProfile.industry}`);
        console.log(`   Website: ${companyProfile.website}`);
        console.log(`   About: ${companyProfile.about?.substring(0, 100)}...`);
        console.log(`   Status: ${companyProfile.status}`);
      } else {
        console.log('\n❌ No company profile found for this user');
      }
      
      // Test the new API endpoint logic
      const userWithProfile = await User.findById(companyUser._id)
        .select('-password')
        .lean();
        
      if (userWithProfile.role === 'company') {
        const profile = await CompanyProfile.findOne({ user: companyUser._id }).lean();
        if (profile) {
          userWithProfile.companyProfile = profile;
        }
      }
      
      console.log('\n✅ API Response would be:');
      console.log('   User Name:', userWithProfile.name);
      console.log('   User Email:', userWithProfile.email);
      console.log('   Company Name:', userWithProfile.companyProfile?.companyName || 'Not found');
      console.log('   Industry:', userWithProfile.companyProfile?.industry || 'Not found');
      
    } else {
      console.log('❌ No company user found in database');
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserDetailsAPI();