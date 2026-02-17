const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');
const OfferLetter = require('./models/OfferLetter');

async function testHiredStudentsAPI() {
  try {
    await mongoose.connect('mongodb+srv://fyp-internship:UiPh7dU2s3qC6Nls@fyp-internship-cluster.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔌 Connected to MongoDB');

    // Find a supervisor to test with
    const supervisor = await User.findOne({ role: 'supervisor' });
    console.log('👨‍💼 Found supervisor:', supervisor?.name || 'No supervisor found');

    if (!supervisor) {
      console.log('❌ No supervisor found in database');
      return;
    }

    // Get hired applications for this supervisor
    const hiredApplications = await Application.find({
      supervisorId: supervisor._id,
      isCurrentlyHired: true,
      overallStatus: 'approved'
    })
    .populate({
      path: 'studentId',
      select: 'name email student'
    })
    .populate({
      path: 'jobId',
      select: 'title',
      populate: {
        path: 'companyId',
        select: 'name'
      }
    });

    console.log('📊 Hired applications found:', hiredApplications.length);

    if (hiredApplications.length === 0) {
      console.log('⚠️ No hired applications found for this supervisor');
      return;
    }

    // Test the data structure for each application
    for (let i = 0; i < Math.min(3, hiredApplications.length); i++) {
      const app = hiredApplications[i];
      console.log(`\n📝 Application ${i + 1}:`);
      console.log('  Student ID:', app.studentId?._id);
      console.log('  Student Name:', app.studentId?.name);
      console.log('  Registration Number:', app.studentId?.student?.regNo);
      console.log('  Job Position:', app.jobPosition);
      console.log('  Job Title:', app.jobId?.title);
      console.log('  Company:', app.jobId?.companyId?.name);
      console.log('  Start Date:', app.startDate);
      console.log('  End Date:', app.endDate);
      
      // Check for offer letter
      const offerLetter = await OfferLetter.findOne({
        studentId: app.studentId._id,
        jobId: app.jobId._id,
        status: 'accepted'
      });
      
      console.log('  Offer Letter:', offerLetter ? 'Found' : 'Not found');
      if (offerLetter) {
        console.log('    Offer Start:', offerLetter.startDate);
        console.log('    Offer End:', offerLetter.endDate);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testHiredStudentsAPI();
