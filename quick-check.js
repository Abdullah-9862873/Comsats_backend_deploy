const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const quickCheck = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Simple direct query
    const users = await mongoose.connection.db.collection('users').find({ role: 'supervisor' }).toArray();
    console.log(`👨‍🏫 Found ${users.length} supervisors`);

    const students = await mongoose.connection.db.collection('users').find({ role: 'student' }).toArray();
    console.log(`👨‍🎓 Found ${students.length} students`);

    const applications = await mongoose.connection.db.collection('applications').find({ supervisorStatus: 'approved' }).toArray();
    console.log(`📝 Found ${applications.length} approved applications`);

    const events = await mongoose.connection.db.collection('weeklyreportevents').find({}).toArray();
    console.log(`📊 Found ${events.length} weekly report events`);

    // Check specific student-supervisor relationships
    console.log('\n🔗 Checking Student-Supervisor relationships...');
    for (const application of applications) {
      const student = await mongoose.connection.db.collection('users').findOne({ _id: application.studentId });
      const supervisor = await mongoose.connection.db.collection('users').findOne({ _id: application.supervisorId });
      console.log(`  ${student?.name} -> ${supervisor?.name}`);
    }

    // If no approved applications exist, create one for testing
    if (applications.length === 0) {
      console.log('\n🛠️  No approved applications found. Creating test data...');
      
      if (students.length > 0 && users.length > 0) {
        const testStudent = students[0];
        const testSupervisor = users[0];
        
        const testApplication = {
          studentId: testStudent._id,
          studentName: testStudent.name,
          studentEmail: testStudent.email,
          supervisorId: testSupervisor._id,
          supervisorName: testSupervisor.name,
          supervisorStatus: 'approved',
          companyId: new mongoose.Types.ObjectId(),
          companyName: 'Test Company',
          jobId: new mongoose.Types.ObjectId(),
          jobTitle: 'Software Developer Intern',
          supervisorReviewedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await mongoose.connection.db.collection('applications').insertOne(testApplication);
        console.log(`✅ Created test application: ${testStudent.name} -> ${testSupervisor.name}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

quickCheck();
