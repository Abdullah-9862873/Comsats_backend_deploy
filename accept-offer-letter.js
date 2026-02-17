const mongoose = require('mongoose');
require('dotenv').config();

async function acceptOfferLetter() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const OfferLetter = require('./models/OfferLetter');
    
    // Find the sent offer letter and accept it
    const offerLetter = await OfferLetter.findOne({ status: 'sent' });
    
    if (offerLetter) {
      console.log('📋 Found offer letter for:', offerLetter.studentName);
      console.log('📅 Dates:', offerLetter.startDate, 'to', offerLetter.endDate);
      
      // Accept the offer letter
      offerLetter.status = 'accepted';
      offerLetter.studentResponse = {
        response: 'accepted',
        studentComments: 'Accepted for testing evaluation system',
        respondedAt: new Date()
      };
      
      await offerLetter.save();
      
      console.log('✅ Offer letter accepted! Status updated to:', offerLetter.status);
    } else {
      console.log('❌ No sent offer letters found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

acceptOfferLetter();