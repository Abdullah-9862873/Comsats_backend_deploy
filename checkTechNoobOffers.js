const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const OfferLetter = require('./models/OfferLetter');
const User = require('./models/User');

const checkTechNoobOffers = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find Tech Noob company
    const techNoob = await User.findOne({ name: 'Tech Noob' });
    if (!techNoob) {
      console.log('❌ Tech Noob not found');
      process.exit(1);
    }

    console.log('✅ Found Tech Noob:');
    console.log('   ID:', techNoob._id);
    console.log('   Email:', techNoob.email);

    // Check all offer letters for Tech Noob
    const allOffers = await OfferLetter.find({ companyId: techNoob._id });
    console.log('\n📋 Tech Noob offer letters:', allOffers.length);

    if (allOffers.length === 0) {
      console.log('❌ No offer letters found for Tech Noob');
      
      // Let's check if there are any offer letters at all
      const totalOffers = await OfferLetter.countDocuments();
      console.log('📊 Total offer letters in database:', totalOffers);
      
      if (totalOffers > 0) {
        console.log('\n🔍 Let\'s see what companies have offer letters:');
        const offersWithCompanies = await OfferLetter.find().populate('companyId', 'name email');
        const companyMap = {};
        offersWithCompanies.forEach(offer => {
          const companyName = offer.companyId?.name || 'Unknown';
          companyMap[companyName] = (companyMap[companyName] || 0) + 1;
        });
        
        Object.entries(companyMap).forEach(([name, count]) => {
          console.log(`   ${name}: ${count} offers`);
        });
      }
    } else {
      console.log('\n📋 Tech Noob offer letters details:');
      allOffers.forEach((offer, index) => {
        console.log(`   ${index + 1}. Status: ${offer.status}`);
        console.log(`      Student Response: ${offer.studentResponse?.response || 'No response'}`);
        console.log(`      Student ID: ${offer.studentId}`);
        console.log(`      Created: ${offer.createdAt}`);
        console.log('');
      });

      // Check for accepted offers
      const acceptedOffers = await OfferLetter.find({
        companyId: techNoob._id,
        $or: [
          { status: 'accepted' },
          { 'studentResponse.response': 'accepted' }
        ]
      });
      console.log('✅ Accepted offers for Tech Noob:', acceptedOffers.length);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkTechNoobOffers();
