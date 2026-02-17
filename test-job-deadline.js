const mongoose = require('mongoose');
const Job = require('./models/Job');

// Test creating a job with application deadline
async function testJobCreationWithDeadline() {
  try {
    await mongoose.connect('mongodb://localhost:27017/internship_portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create a test job with application deadline
    const testJobData = {
      jobTitle: 'Test Job with Deadline',
      location: 'Test Location',
      workType: 'On-site',
      duration: '3 months',
      salary: '30,000 PKR',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2026-02-28'),
      jobDescription: 'This is a test job with application deadline',
      requirements: ['Test requirement 1', 'Test requirement 2'],
      technologyStack: ['React', 'Node.js'],
      companyId: '68dd6cc56b28df89200ce2d3', // Use existing company ID
      companyName: 'Test Company',
      applicationLimit: 25,
      applicationDeadline: new Date('2025-11-25'), // Deadline before start date
      status: 'Active'
    };

    console.log('🔄 Creating test job with deadline...');
    const newJob = new Job(testJobData);
    const savedJob = await newJob.save();

    console.log('✅ Job created successfully!');
    console.log(`📋 Job ID: ${savedJob._id}`);
    console.log(`📅 Application Deadline: ${savedJob.applicationDeadline.toLocaleDateString()}`);
    console.log(`📅 Start Date: ${savedJob.startDate.toLocaleDateString()}`);
    console.log(`🏢 Company: ${savedJob.companyName}`);

    // Test finding the job
    const foundJob = await Job.findById(savedJob._id);
    console.log('✅ Job retrieval test passed');
    console.log(`📋 Retrieved job: ${foundJob.jobTitle}`);
    console.log(`📅 Retrieved deadline: ${foundJob.applicationDeadline.toLocaleDateString()}`);

    // Clean up - delete test job
    await Job.findByIdAndDelete(savedJob._id);
    console.log('🗑️ Test job deleted');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testJobCreationWithDeadline();