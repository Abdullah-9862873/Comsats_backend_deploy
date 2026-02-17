const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');
const Job = require('./models/Job');
const Company = require('./models/CompanyProfile');

mongoose.connect('mongodb://localhost:27017/Fyp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('🔗 Connected to MongoDB');

  try {
    // Get test users
    const student = await User.findOne({ role: 'student' });
    const supervisor = await User.findOne({ role: 'supervisor' });
    const company = await User.findOne({ role: 'company' });

    if (!student || !supervisor || !company) {
      console.log('❌ Missing test users. Please run create-test-users.js first.');
      return;
    }

    console.log('📋 Found test users:');
    console.log(`   Student: ${student.name} (${student.student?.regNo})`);
    console.log(`   Supervisor: ${supervisor.name}`);
    console.log(`   Company: ${company.name}`);

    // Create a test company record
    const testCompany = new Company({
      user: company._id,
      companyName: company.company.companyName,
      industry: company.company.industry,
      about: company.company.about,
      website: company.company.website,
      companyEmail: company.email,
      companyPhone: '+1-555-9999',
      address: '123 Tech Street, Silicon Valley'
    });
    await testCompany.save();

    // Create a test job
    const testJob = new Job({
      title: 'Software Developer Intern',
      description: 'Great opportunity for software development experience',
      requirements: ['JavaScript', 'Node.js', 'React'],
      company: testCompany._id,
      location: 'Remote',
      duration: '3 months',
      stipend: 1000,
      status: 'active'
    });
    await testJob.save();

    // Create a test application
    const testApplication = new Application({
      student: student._id,
      job: testJob._id,
      company: testCompany._id,
      supervisor: supervisor._id,
      status: 'accepted',
      appliedAt: new Date(),
      // Add some test documents
      documents: {
        resume: 'test-resume.pdf',
        coverLetter: 'test-cover.pdf'
      }
    });
    await testApplication.save();

    console.log('\n🎉 Created test data:');
    console.log(`   Company ID: ${testCompany._id}`);
    console.log(`   Job ID: ${testJob._id}`);
    console.log(`   Application ID: ${testApplication._id}`);
    console.log(`\n📧 You can now test the email functionality using these IDs:`);
    console.log(`   Student ID: ${student._id}`);
    console.log(`   Application ID: ${testApplication._id}`);

    // Example POST data for testing
    console.log('\n📋 Example evaluation submission data:');
    console.log(JSON.stringify({
      internId: student._id.toString(),
      applicationId: testApplication._id.toString(),
      evaluation: {
        technicalSkills: 8,
        communicationSkills: 9,
        problemSolving: 7,
        teamwork: 8,
        punctuality: 9,
        overallPerformance: 8,
        comments: 'Excellent intern with great potential!'
      }
    }, null, 2));

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    mongoose.disconnect();
    console.log('\n🔚 Disconnected from MongoDB');
  }
}).catch(error => {
  console.error('❌ Failed to connect to MongoDB:', error);
});