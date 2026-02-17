const mongoose = require('mongoose');
require('dotenv').config();

async function createTestCompany() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    const CompanyProfile = require('./models/CompanyProfile');
    
    // Create a test company user with incomplete profile
    const testCompany = new User({
      name: 'Test Incomplete Company',
      email: 'test-incomplete-2@test.com',
      password: 'password123', // This will be hashed automatically
      role: 'company',
      isVerified: true,
      company: {
        companyName: 'Test Incomplete Company',
        industry: 'Technology'
      }
    });
    
    await testCompany.save();
    console.log('✅ Created test company user:', testCompany.email);
    
    // Create incomplete profile (only basic fields)
    const incompleteProfile = new CompanyProfile({
      user: testCompany._id,
      companyName: 'Test Incomplete Company',
      companyEmail: testCompany.email,
      industry: 'Technology',
      // Missing: about, website, foundedYear, employeeCount, headquartersLocation, 
      // vision, mission, contactPerson to keep profile incomplete
    });
    
    await incompleteProfile.save();
    console.log('✅ Created incomplete profile. Completeness:', incompleteProfile.profileCompleteness + '%');
    
    // Also create a complete company for comparison
    const completeCompanyUser = new User({
      name: 'Complete Test Company',
      email: 'test-complete-2@test.com',
      password: 'password123',
      role: 'company',
      isVerified: true,
      company: {
        companyName: 'Complete Test Company',
        industry: 'Technology'
      }
    });
    
    await completeCompanyUser.save();
    console.log('✅ Created complete company user:', completeCompanyUser.email);
    
    const completeProfile = new CompanyProfile({
      user: completeCompanyUser._id,
      companyName: 'Complete Test Company',
      companyEmail: completeCompanyUser.email,
      industry: 'Technology',
      about: 'A leading technology company focused on innovative solutions.',
      website: 'https://completetestcompany.com',
      foundedYear: 2020,
      employeeCount: '11-50',
      headquartersLocation: 'New York, USA',
      vision: 'To revolutionize technology solutions for businesses worldwide.',
      mission: 'Providing cutting-edge technology services and solutions.',
      contactPerson: {
        name: 'John Manager',
        email: 'john@completetestcompany.com',
        phone: '+1-555-123-4567'
      },
      specialties: ['Software Development', 'AI Solutions', 'Cloud Computing']
    });
    
    await completeProfile.save();
    console.log('✅ Created complete profile. Completeness:', completeProfile.profileCompleteness + '%');
    
    console.log('\n📋 Test Company Credentials:');
    console.log('Incomplete Company (Modal should appear):');
    console.log('  Email: test-incomplete-2@test.com');
    console.log('  Password: password123');
    console.log('  Profile Completeness:', incompleteProfile.profileCompleteness + '%');
    console.log('\nComplete Company (No modal):');
    console.log('  Email: test-complete-2@test.com');
    console.log('  Password: password123');
    console.log('  Profile Completeness:', completeProfile.profileCompleteness + '%');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating test company:', error);
  }
}

createTestCompany();