const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const OfferLetter = require('./models/OfferLetter');
const User = require('./models/User');

const createAcceptedOffersForTechNoob = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find Tech Noob company
    const techNoob = await User.findOne({ name: 'Tech Noob' });
    console.log('✅ Found Tech Noob:', techNoob.name);

    // Update the existing offer letters to be accepted
    const existingOffers = await OfferLetter.find({ companyId: techNoob._id });
    console.log('📋 Found', existingOffers.length, 'existing offers for Tech Noob');

    for (let i = 0; i < existingOffers.length; i++) {
      const offer = existingOffers[i];
      
      // Update the offer to be accepted
      await OfferLetter.findByIdAndUpdate(offer._id, {
        status: 'accepted',
        'studentResponse.response': 'accepted',
        'studentResponse.message': 'I accept this offer letter. Thank you for the opportunity.',
        'studentResponse.respondedAt': new Date()
      });

      console.log(`✅ Updated offer ${i + 1} to accepted status`);
    }

    // Verify the updates
    const acceptedOffers = await OfferLetter.find({
      companyId: techNoob._id,
      $or: [
        { status: 'accepted' },
        { 'studentResponse.response': 'accepted' }
      ]
    }).populate('studentId', 'name email');

    console.log('\n🎉 Tech Noob now has', acceptedOffers.length, 'accepted offers:');
    acceptedOffers.forEach((offer, index) => {
      console.log(`   ${index + 1}. Student: ${offer.studentId?.name || 'Unknown'}`);
      console.log(`      Email: ${offer.studentId?.email || 'Unknown'}`);
      console.log(`      Status: ${offer.status}`);
      console.log(`      Student Response: ${offer.studentResponse?.response}`);
      console.log('');
    });

    console.log('✅ Tech Noob can now submit misconduct reports!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAcceptedOffersForTechNoob();
