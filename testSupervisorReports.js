const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const { getSupervisorReports } = require('./controllers/misconductReportController');

const testSupervisorReports = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find supervisor user
    const supervisor = await User.findOne({ name: 'Jamal' });
    console.log('✅ Found supervisor:', supervisor.name);

    // Test getting company reports for supervisor
    console.log('\n🧪 Testing supervisor dashboard - Company Reports tab');
    
    const req = {
      user: { id: supervisor._id.toString() }
    };

    const res = {
      json: (data) => {
        console.log('✅ Supervisor reports response:');
        console.log(`   Total reports: ${data.data.length}`);
        
        if (data.data.length > 0) {
          data.data.forEach((report, index) => {
            console.log(`   ${index + 1}. Report ID: ${report._id}`);
            console.log(`      Student: ${report.studentName}`);
            console.log(`      Company: ${report.companyName}`);
            console.log(`      Issue Type: ${report.issueType}`);
            console.log(`      Status: ${report.status}`);
            console.log(`      Date: ${new Date(report.incidentDate).toLocaleDateString()}`);
            console.log(`      Description: ${report.description.substring(0, 100)}...`);
            console.log('');
          });
        } else {
          console.log('   No reports found for this supervisor');
        }
      },
      status: (code) => ({ json: (data) => console.log('❌ Error:', data) })
    };

    await getSupervisorReports(req, res);

    console.log('🎉 Supervisor dashboard test completed successfully!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testSupervisorReports();
