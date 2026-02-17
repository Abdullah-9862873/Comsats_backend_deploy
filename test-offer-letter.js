const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const OfferLetter = require('./models/OfferLetter');
const Application = require('./models/Application');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for Offer Letter Testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test offer letter functionality
const testOfferLetter = async () => {
  try {
    await connectDB();

    console.log('\n🧪 Testing Offer Letter Model...');

    // Create a test offer letter
    const testOfferLetter = new OfferLetter({
      applicationId: new mongoose.Types.ObjectId(),
      studentId: new mongoose.Types.ObjectId(),
      studentName: 'John Doe',
      studentEmail: 'john.doe@example.com',
      companyId: new mongoose.Types.ObjectId(),
      organizationName: 'Tech Solutions Inc.',
      organizationAddress: '123 Tech Street, Silicon Valley, CA',
      representativeName: 'Jane Smith',
      representativePosition: 'HR Manager',
      jobTitle: 'Software Developer Intern',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      customMessage: 'We are excited to have you join our team!',
      offerLetterContent: `Tech Solutions Inc.
123 Tech Street, Silicon Valley, CA

Date: ${new Date().toLocaleDateString()}

Dear John Doe,

We are pleased to offer you the position of Software Developer Intern at Tech Solutions Inc.

Your internship will commence on June 1, 2024 and conclude on August 31, 2024.

We are excited to have you join our team!

We look forward to having you on our team.

Sincerely,
Jane Smith
HR Manager`
    });

    // Save the offer letter
    const savedOfferLetter = await testOfferLetter.save();
    console.log('✅ Test offer letter created successfully');
    console.log('📄 Offer Letter ID:', savedOfferLetter._id);

    // Test querying offer letters
    const foundOfferLetter = await OfferLetter.findById(savedOfferLetter._id);
    console.log('✅ Offer letter retrieved successfully');
    console.log('📋 Organization:', foundOfferLetter.organizationName);
    console.log('👤 Student:', foundOfferLetter.studentName);
    console.log('💼 Position:', foundOfferLetter.jobTitle);
    console.log('📅 Duration:', foundOfferLetter.startDate.toDateString(), 'to', foundOfferLetter.endDate.toDateString());

    // Test updating offer letter status
    foundOfferLetter.studentResponse = {
      response: 'accepted',
      studentComments: 'Thank you for this opportunity!',
      respondedAt: new Date()
    };
    foundOfferLetter.status = 'accepted';
    
    await foundOfferLetter.save();
    console.log('✅ Offer letter status updated successfully');
    console.log('📝 Student Response:', foundOfferLetter.studentResponse.response);

    // Clean up test data
    await OfferLetter.findByIdAndDelete(savedOfferLetter._id);
    console.log('🧹 Test data cleaned up');

    console.log('\n🎉 All offer letter tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the test
testOfferLetter();