const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const Student = require('./models/Student');
const OfferLetter = require('./models/OfferLetter');

const testStudentsWithAcceptedOffers = async () => {
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

    // Check offers where studentResponse.response is 'accepted'
    const acceptedOfferLetters = await OfferLetter.find({
      companyId: company._id,
      $or: [
        { status: 'accepted' },
        { 'studentResponse.response': 'accepted' }
      ]
    }).populate('studentId', 'name email');

    console.log(`✅ Found ${acceptedOfferLetters.length} accepted offer letters`);

    if (acceptedOfferLetters.length > 0) {
      console.log('\n📋 Students with Accepted Offers:');
      acceptedOfferLetters.forEach((offer, index) => {
        console.log(`${index + 1}. Student: ${offer.studentName} (${offer.studentEmail})`);
        console.log(`   Job: ${offer.jobTitle}`);
        console.log(`   Main Status: ${offer.status}`);
        console.log(`   Student Response: ${offer.studentResponse?.response || 'N/A'}`);
        console.log(`   Student ID: ${offer.studentId?._id || offer.studentId}`);
        console.log('---');
      });

      // Test the API endpoint simulation
      console.log('\n🧪 Testing API endpoint simulation:');
      
      const studentsForDropdown = acceptedOfferLetters
        .map(offer => ({
          _id: offer.studentId._id || offer.studentId,
          name: offer.studentName,
          email: offer.studentEmail,
          jobTitle: offer.jobTitle
        }))
        .filter(student => student !== null);

      // Remove duplicates
      const uniqueStudents = studentsForDropdown.filter((student, index, self) => 
        index === self.findIndex(s => s._id.toString() === student._id.toString())
      );

      console.log(`✅ API would return ${uniqueStudents.length} students for misconduct dropdown:`);
      uniqueStudents.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (${student.email}) - ${student.jobTitle}`);
      });

    } else {
      console.log('❌ No students with accepted offers found');
      
      // Let's check all offers to see what responses exist
      const allOffers = await OfferLetter.find({ companyId: company._id });
      console.log('\n📊 All offer letter responses:');
      const responses = {};
      allOffers.forEach(offer => {
        const response = offer.studentResponse?.response || 'no-response';
        responses[response] = (responses[response] || 0) + 1;
      });
      console.log(responses);

      // Check if there are any offers with accepted studentResponse
      const offersWithAcceptedResponse = await OfferLetter.find({
        companyId: company._id,
        'studentResponse.response': 'accepted'
      });
      console.log(`Found ${offersWithAcceptedResponse.length} offers with accepted student response`);
    }

    console.log('\n✅ Test completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testStudentsWithAcceptedOffers();
