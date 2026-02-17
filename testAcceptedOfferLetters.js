const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const Student = require('./models/Student');
const OfferLetter = require('./models/OfferLetter');

const testAcceptedOfferLetters = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find a company user
    const company = await User.findOne({ role: 'company' });
    if (!company) {
      console.log('❌ No company found');
      process.exit(1);
    }
    console.log('✅ Found company:', company.name);

    // Check all offer letters for this company
    const allOfferLetters = await OfferLetter.find({ companyId: company._id });
    console.log(`📄 Total offer letters for ${company.name}:`, allOfferLetters.length);

    // Check accepted offer letters
    const acceptedOfferLetters = await OfferLetter.find({ 
      companyId: company._id, 
      status: 'accepted' 
    }).populate('studentId', 'name email');

    console.log(`✅ Accepted offer letters:`, acceptedOfferLetters.length);

    if (acceptedOfferLetters.length > 0) {
      console.log('\n📋 Accepted Offer Letter Details:');
      acceptedOfferLetters.forEach((offer, index) => {
        console.log(`${index + 1}. Student: ${offer.studentName} (${offer.studentEmail})`);
        console.log(`   Job: ${offer.jobTitle}`);
        console.log(`   Status: ${offer.status}`);
        console.log(`   Student ID: ${offer.studentId}`);
        console.log('---');
      });

      // For each accepted offer, check if student has supervisor
      console.log('\n🔍 Checking supervisor assignments:');
      for (const offer of acceptedOfferLetters) {
        const student = await Student.findOne({ email: offer.studentEmail });
        if (student) {
          console.log(`✅ Student ${offer.studentName} profile found`);
          console.log(`   Has supervisor: ${student.selectedSupervisorId ? 'YES' : 'NO'}`);
          if (student.selectedSupervisorId) {
            const supervisor = await User.findById(student.selectedSupervisorId);
            console.log(`   Supervisor: ${supervisor ? supervisor.name : 'Not found'}`);
          }
        } else {
          console.log(`❌ Student ${offer.studentName} profile NOT found in Student collection`);
        }
        console.log('---');
      }
    } else {
      console.log('❌ No accepted offer letters found');
      
      // Check if there are any offer letters at all
      if (allOfferLetters.length > 0) {
        console.log('\n📋 All Offer Letter Statuses:');
        const statusCount = {};
        allOfferLetters.forEach(offer => {
          statusCount[offer.status] = (statusCount[offer.status] || 0) + 1;
        });
        console.log(statusCount);
        
        console.log('\n📋 Sample Offer Letters:');
        allOfferLetters.slice(0, 3).forEach((offer, index) => {
          console.log(`${index + 1}. Student: ${offer.studentName}`);
          console.log(`   Status: ${offer.status}`);
          console.log(`   Response: ${offer.studentResponse?.response || 'N/A'}`);
          console.log('---');
        });
      }
    }

    console.log('\n✅ Test completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testAcceptedOfferLetters();
