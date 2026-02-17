const mongoose = require('mongoose');
require('dotenv').config();

async function testEvaluationDates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const OfferLetter = require('./models/OfferLetter');
    const Application = require('./models/Application');
    const Job = require('./models/Job');
    
    // Test the exact logic from supervisorEvaluationController
    const studentId = '68c408da05e3d86c91af17d2';
    
    console.log('\n🔍 Testing evaluation date fetching for student:', studentId);
    
    // Fetch offer letter (primary source)
    const offerLetter = await OfferLetter.findOne({
      studentId: studentId,
      status: { $in: ['sent', 'accepted'] }
    });
    
    if (offerLetter) {
      console.log('\n✅ Found Offer Letter:');
      console.log('  📅 Start Date:', offerLetter.startDate);
      console.log('  📅 End Date:', offerLetter.endDate);
      console.log('  📊 Status:', offerLetter.status);
      console.log('  🏢 Company:', offerLetter.organizationName);
      
      // Calculate duration
      const startDate = new Date(offerLetter.startDate);
      const endDate = new Date(offerLetter.endDate);
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const durationWeeks = Math.ceil(durationDays / 7);
      const durationMonths = Math.ceil(durationDays / 30);
      
      console.log('\n📊 Calculated Duration:');
      console.log('  📅 Days:', durationDays);
      console.log('  📅 Weeks:', durationWeeks);
      console.log('  📅 Months:', durationMonths);
      
    } else {
      console.log('❌ No offer letter found - checking fallback sources...');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testEvaluationDates();