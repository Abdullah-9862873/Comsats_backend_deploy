// Simple test to check if the offer letter controller loads
try {
  console.log('Testing offer letter controller import...');
  const controller = require('./controllers/offerLetterController');
  console.log('✅ Controller loaded successfully');
  console.log('Available functions:', Object.keys(controller));
  
  console.log('\nTesting route import...');
  const routes = require('./routes/offerLetters');
  console.log('✅ Routes loaded successfully');
  
  console.log('\nTesting model import...');
  const OfferLetter = require('./models/OfferLetter');
  console.log('✅ Model loaded successfully');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}