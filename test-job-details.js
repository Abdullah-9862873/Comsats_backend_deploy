const mongoose = require('mongoose');
const Job = require('./models/Job');
const Application = require('./models/Application');
const User = require('./models/User'); // Need this for populate

// Test job details fetch
async function testJobDetails() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/internship_portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find a sample job
    const jobs = await Job.find().limit(1);
    if (jobs.length === 0) {
      console.log('❌ No jobs found');
      return;
    }

    const jobId = jobs[0]._id;
    console.log('🔍 Testing job details for:', jobId);

    // Test the same logic as our controller
    const job = await Job.findById(jobId)
      .populate('companyId', 'companyName email website industry about')
      .lean();

    if (!job) {
      console.log('❌ Job not found');
      return;
    }

    console.log('✅ Job found:', job.jobTitle);
    console.log('📋 Job fields:', Object.keys(job));

    // Fetch applications for this job
    const applications = await Application.find({ jobId: jobId })
      .select('status createdAt')
      .lean();

    console.log('📊 Applications found:', applications.length);

    // Count applications by status
    const applicationStats = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Application stats:', applicationStats);

    const jobDetails = {
      ...job,
      applications: applications,
      applicationStats: {
        total: applications.length,
        pending: applicationStats.pending || 0,
        shortlisted: applicationStats.shortlisted || 0,
        accepted: applicationStats.accepted || 0,
        rejected: applicationStats.rejected || 0
      }
    };

    console.log('✅ Job details prepared successfully');
    console.log('🎯 Final job details keys:', Object.keys(jobDetails));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testJobDetails();