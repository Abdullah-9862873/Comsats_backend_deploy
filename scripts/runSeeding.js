require('dotenv').config();
const mongoose = require('mongoose');
const { seedCompanies } = require('./seedCompanies');
const { seedJobs } = require('./seedJobs');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internship-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Main seeding function
const runSeeding = async () => {
  try {
    console.log('🚀 Starting comprehensive seeding process...');
    console.log('=' .repeat(50));
    
    // Connect to database
    await connectDB();
    
    // Seed companies first (jobs depend on companies)
    console.log('\n📢 Phase 1: Seeding Companies');
    console.log('-'.repeat(30));
    await seedCompanies();
    
    // Wait a moment for companies to be fully created
    console.log('\n⏳ Waiting for companies to be fully processed...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Seed jobs
    console.log('\n📢 Phase 2: Seeding Jobs');
    console.log('-'.repeat(30));
    await seedJobs();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('📊 Summary:');
    console.log('   • 50 Companies with full profiles');
    console.log('   • 70 Job postings with complete details');
    console.log('   • All data ready for production use');
    console.log('=' .repeat(50));
    
    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  }
};

// Run the seeding process
if (require.main === module) {
  runSeeding();
}

module.exports = { runSeeding };