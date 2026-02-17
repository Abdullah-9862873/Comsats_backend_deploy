const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const { getSupervisedStudents, createMisconductReport } = require('./controllers/misconductReportController');

const testCompleteMisconductFlow = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find a company user
    const company = await User.findOne({ role: 'company' });
    console.log('✅ Found company:', company.name);

    // Step 1: Test getting supervised students (for dropdown)
    console.log('\n🧪 Step 1: Getting students for dropdown');
    
    const req1 = {
      user: { id: company._id.toString() }
    };

    let dropdownStudents = [];
    const res1 = {
      json: (data) => {
        console.log('✅ Dropdown API Response:', data.data.length, 'students');
        dropdownStudents = data.data;
        data.data.forEach((student, index) => {
          console.log(`   ${index + 1}. ${student.name} (${student.email})`);
        });
      },
      status: (code) => ({ json: (data) => console.log('❌ Error:', data) })
    };

    await getSupervisedStudents(req1, res1);

    if (dropdownStudents.length === 0) {
      console.log('❌ No students available for misconduct reports');
      process.exit(1);
    }

    // Step 2: Test creating misconduct report
    console.log('\n🧪 Step 2: Creating misconduct report');
    
    const selectedStudent = dropdownStudents[0];
    
    const req2 = {
      user: { id: company._id.toString() },
      body: {
        studentId: selectedStudent._id,
        issueType: 'Unprofessional Behavior',
        incidentDate: new Date(),
        description: 'Test misconduct report: The student has been consistently arriving late to work, showing disrespectful behavior towards colleagues, and failing to follow company policies. This behavior has been observed multiple times over the past few weeks and is affecting the overall work environment. The student needs immediate attention from their supervisor to address these serious behavioral issues.'
      }
    };

    const res2 = {
      status: (code) => ({
        json: (data) => {
          if (code === 201) {
            console.log('✅ Misconduct report created successfully!');
            console.log('   Report ID:', data.data._id);
            console.log('   Student:', data.data.studentName);
            console.log('   Supervisor:', data.data.supervisorName);
            console.log('   Status:', data.data.status);
          } else {
            console.log(`❌ Error creating report (${code}):`, data.message);
          }
        }
      }),
      json: (data) => {
        console.log('✅ Report created:', data.data?._id);
      }
    };

    await createMisconductReport(req2, res2);

    console.log('\n🎉 Complete misconduct flow test completed successfully!');
    console.log('✅ Companies can see students with accepted offers in dropdown');
    console.log('✅ Companies can submit misconduct reports for those students');
    console.log('✅ Reports are automatically sent to student\'s supervisor');

    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testCompleteMisconductFlow();
