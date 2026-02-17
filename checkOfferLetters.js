const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkOfferLetters = async () => {
  try {
    await connectDB();

    const User = require('./models/User');
    const OfferLetter = require('./models/OfferLetter');
    const offers = await OfferLetter.find()
      .populate('studentId', 'name email')
      .populate('companyId', 'name email');
    
    console.log('📋 Existing Offer Letters:', offers.length);
    offers.forEach((offer, index) => {
      console.log(`${index + 1}. Company: ${offer.companyId?.name || 'Unknown'} -> Student: ${offer.studentId?.name || 'Unknown'}`);
    });

    if (offers.length === 0) {
      console.log('⚠️ No offer letters found! This is why the misconduct report dropdown is empty.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkOfferLetters();
