const mongoose = require('mongoose');
require('dotenv').config();

const Application = require('./models/Application');
const User = require('./models/User');

async function testCompanyNames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check applications with company names
    const applications = await Application.find({ overallStatus: 'approved' })
      .populate('companyId', 'name email company')
      .limit(5)
      .lean();

    console.log(`📊 Found ${applications.length} approved applications`);

    if (applications.length > 0) {
      console.log('\n🏢 Company name data structure analysis:');
      applications.forEach((app, index) => {
        console.log(`\n--- Application ${index + 1} ---`);
        console.log('Application ID:', app._id);
        console.log('Student ID:', app.studentId);
        console.log('Direct companyName field:', app.companyName);
        console.log('CompanyId populated name:', app.companyId?.name);
        console.log('CompanyId populated company.companyName:', app.companyId?.company?.companyName);
        
        // Show what our new logic would return
        const resolvedName = app.companyName || app.companyId?.company?.companyName || app.companyId?.name || 'Unknown Company';
        console.log('🎯 Resolved company name:', resolvedName);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testCompanyNames();
