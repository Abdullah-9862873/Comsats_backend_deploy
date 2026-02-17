const mongoose = require('mongoose');
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');

const mongoURI = 'mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';

async function migrateExistingCompanies() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Checking for existing company users with old data structure:\n');

    // Find company users that have company data but no CompanyProfile
    const companyUsers = await User.find({ 
      role: 'company',
      'company.companyName': { $exists: true } 
    });

    console.log(`📊 Found ${companyUsers.length} company users with old data structure\n`);

    if (companyUsers.length > 0) {
      console.log('🔄 Migrating company users to new CompanyProfile structure:\n');

      for (let i = 0; i < companyUsers.length; i++) {
        const user = companyUsers[i];
        
        console.log(`🏢 Migrating Company ${i + 1}:`);
        console.log(`   👤 User: ${user.name} (${user.email})`);
        console.log(`   📋 Company Name: ${user.company?.companyName || 'N/A'}`);
        console.log(`   📋 Industry: ${user.company?.industry || 'N/A'}`);
        console.log(`   📋 Website: ${user.company?.website || 'N/A'}`);
        console.log(`   📋 About: ${user.company?.about || 'N/A'}`);

        // Check if CompanyProfile already exists
        const existingProfile = await CompanyProfile.findOne({ user: user._id });
        
        if (!existingProfile) {
          // Create new CompanyProfile
          const companyProfile = new CompanyProfile({
            user: user._id,
            companyName: user.company?.companyName || user.name,
            industry: user.company?.industry || '',
            website: user.company?.website || '',
            about: user.company?.about || '',
            status: 'pending' // Set to pending for admin approval
          });

          await companyProfile.save();
          console.log(`   ✅ Created CompanyProfile with status: pending`);

          // Remove old company data from User model (optional cleanup)
          await User.findByIdAndUpdate(user._id, { $unset: { company: 1 } });
          console.log(`   🧹 Cleaned up old company data from User model`);
        } else {
          console.log(`   ⚠️ CompanyProfile already exists, skipping`);
        }
        
        console.log('');
      }

      console.log('🎉 Migration completed!\n');
    } else {
      console.log('✅ No company users found with old data structure\n');
    }

    // Show current state
    console.log('📊 Current state after migration:');
    
    const allCompanyProfiles = await CompanyProfile.find()
      .populate('user', 'name email createdAt isVerified')
      .sort({ createdAt: -1 });

    console.log(`   📋 Total CompanyProfiles: ${allCompanyProfiles.length}`);
    
    if (allCompanyProfiles.length > 0) {
      console.log('   🏢 Companies:');
      allCompanyProfiles.forEach((company, index) => {
        console.log(`      ${index + 1}. ${company.companyName} (${company.status}) - ${company.user?.email}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}

migrateExistingCompanies();