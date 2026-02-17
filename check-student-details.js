const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');
const OfferLetter = require('./models/OfferLetter');
const Job = require('./models/Job');

async function checkStudentDetails() {
  try {
    await mongoose.connect('mongodb+srv://fyp-internship:UiPh7dU2s3qC6Nls@fyp-internship-cluster.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔌 Connected to MongoDB');

    // Find Student_5
    const student5 = await User.findOne({ email: 'Student_5@gmail.com' });
    
    if (!student5) {
      console.log('❌ Student_5@gmail.com not found');
      return;
    }

    console.log('👨‍🎓 Student_5 Details:');
    console.log('  ID:', student5._id);
    console.log('  Name:', student5.name);
    console.log('  Email:', student5.email);
    console.log('  Role:', student5.role);
    console.log('  Student Object:', JSON.stringify(student5.student, null, 2));
    console.log('  Department:', student5.department);
    console.log('  Profile:', JSON.stringify(student5.profile, null, 2));

    // Find applications for this student
    const applications = await Application.find({ studentId: student5._id })
      .populate('jobId')
      .populate('supervisorId', 'name');

    console.log('\n📋 Applications for Student_5:', applications.length);

    applications.forEach((app, index) => {
      console.log(`\n  Application ${index + 1}:`);
      console.log('    Application ID:', app._id);
      console.log('    Job Position:', app.jobPosition);
      console.log('    Department:', app.department);
      console.log('    Status:', app.overallStatus);
      console.log('    isCurrentlyHired:', app.isCurrentlyHired);
      console.log('    Supervisor:', app.supervisorId?.name);
      console.log('    Job Details:', {
        id: app.jobId?._id,
        title: app.jobId?.title,
        position: app.jobId?.position,
        department: app.jobId?.department
      });
      console.log('    Student Profile in App:', JSON.stringify(app.studentProfile, null, 2));
    });

    // Check jobs
    const jobs = await Job.find().populate('companyId', 'name');
    console.log('\n💼 All Jobs in Database:', jobs.length);
    
    jobs.forEach((job, index) => {
      if (index < 5) { // Show first 5 jobs
        console.log(`  Job ${index + 1}:`);
        console.log('    Title:', job.title);
        console.log('    Position:', job.position);
        console.log('    Department:', job.department);
        console.log('    Company:', job.companyId?.name);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkStudentDetails();
