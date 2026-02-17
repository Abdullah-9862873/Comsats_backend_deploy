const mongoose = require('mongoose');
require('dotenv').config();

async function checkOfferLetters() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const OfferLetter = require('./models/OfferLetter');
    const User = require('./models/User'); // Need to import User model for populate
    
    // Check all offer letters without populate first
    const offerLetters = await OfferLetter.find();
    
    console.log(`\n📋 Found ${offerLetters.length} offer letters:`);
    
    offerLetters.forEach((offer, index) => {
      console.log(`\n--- Offer Letter ${index + 1} ---`);
      console.log('Student ID:', offer.studentId);
      console.log('Company ID:', offer.companyId);
      console.log('Status:', offer.status);
      console.log('Start Date:', offer.startDate);
      console.log('End Date:', offer.endDate);
      console.log('Organization:', offer.organizationName);
    });
    
    // Check accepted offer letters specifically
    const acceptedOffers = await OfferLetter.find({ status: 'accepted' });
    
    console.log(`\n✅ Found ${acceptedOffers.length} accepted offer letters:`);
    acceptedOffers.forEach(offer => {
      console.log(`- Student ID ${offer.studentId}: ${offer.startDate} to ${offer.endDate}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkOfferLetters();