console.log('Testing basic script execution...');

const mongoose = require('mongoose');

async function quickTest() {
  console.log('Script started');
  try {
    console.log('Attempting MongoDB connection...');
    await mongoose.connect('mongodb+srv://fyp-internship:UiPh7dU2s3qC6Nls@fyp-internship-cluster.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Collections found:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

quickTest();
