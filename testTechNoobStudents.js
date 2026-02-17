const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const { getSupervisedStudents } = require('./controllers/misconductReportController');

const testTechNoobStudents = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    console.log('🧪 Testing getSupervisedStudents for Tech Noob...');

    const req = {
      user: { 
        id: '68a9dcf658d427c2dea40814',  // Tech Noob ID
        name: 'Tech Noob',
        email: 'company__2@gmail.com'
      },
      headers: { 
        authorization: 'Bearer test-token' 
      }
    };

    const res = {
      json: (data) => {
        console.log('✅ API Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success && data.data.length > 0) {
          console.log('\n👥 Students available for Tech Noob:');
          data.data.forEach((student, index) => {
            console.log(`   ${index + 1}. ${student.name} (${student.email})`);
          });
        } else {
          console.log('❌ No students found for Tech Noob');
        }
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Error ${code}:`, data);
        }
      })
    };

    await getSupervisedStudents(req, res);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testTechNoobStudents();
