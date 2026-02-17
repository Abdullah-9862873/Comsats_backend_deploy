const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const { getSupervisedStudents } = require('./controllers/misconductReportController');

const testMisconductAPIEndpoint = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find a company user
    const company = await User.findOne({ role: 'company' });
    if (!company) {
      console.log('❌ No company found');
      process.exit(1);
    }
    console.log('✅ Found company:', company.name, company._id);

    // Mock request and response objects
    const req = {
      user: {
        id: company._id.toString()
      }
    };

    const res = {
      json: (data) => {
        console.log('\n📋 API Response:');
        console.log(JSON.stringify(data, null, 2));
      },
      status: (code) => ({
        json: (data) => {
          console.log(`\n❌ Error Response (${code}):`);
          console.log(JSON.stringify(data, null, 2));
        }
      })
    };

    // Call the API function
    console.log('\n🧪 Testing getSupervisedStudents API:');
    await getSupervisedStudents(req, res);

    console.log('\n✅ API test completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testMisconductAPIEndpoint();
