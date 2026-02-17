const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');

const testFrontendVsBackend = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find Tech Pro company (this is what frontend would be using)
    const company = await User.findOne({ name: 'Tech Pro' });
    console.log('✅ Found company:', company.name);

    // Check if this company is currently logged in by looking for recent logins
    console.log('\n🔍 Company details for frontend comparison:');
    console.log('- ID:', company._id.toString());
    console.log('- Role:', company.role);
    console.log('- Email:', company.email);

    // Test the controller function directly
    console.log('\n🧪 Testing getSupervisedStudents controller directly:');
    const { getSupervisedStudents } = require('./controllers/misconductReportController');

    const mockReq = {
      user: { 
        id: company._id.toString(),  // This is how auth middleware sets it
        role: company.role,
        email: company.email
      },
      headers: {
        authorization: 'Bearer mock-token-for-testing'
      }
    };

    const mockRes = {
      json: (data) => {
        console.log('✅ Controller response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.data.length > 0) {
          console.log('\n👥 Students found by controller:');
          data.data.forEach((student, index) => {
            console.log(`   ${index + 1}. ${student.name} (${student.email})`);
          });
        } else {
          console.log('❌ No students found by controller');
        }
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Controller returned error ${code}:`, data);
        }
      })
    };

    await getSupervisedStudents(mockReq, mockRes);

    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testFrontendVsBackend();
