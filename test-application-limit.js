const mongoose = require('mongoose');
const Job = require('./models/Job');
const Application = require('./models/Application');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/internship_portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const testApplicationLimit = async () => {
  try {
    await connectDB();

    console.log('\n🧪 Testing Application Limit Feature\n');

    // Find a job with application limit
    const job = await Job.findOne({ applicationLimit: { $exists: true } });
    
    if (!job) {
      console.log('❌ No job found with application limit. Creating a test job...');
      
      // Create a test job with low application limit for testing
      const testJob = new Job({
        jobTitle: 'Test Application Limit Job',
        location: 'Test Location',
        workType: 'Remote',
        duration: '3 months',
        salary: 'Test Salary',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        jobDescription: 'Test job for application limit feature',
        requirements: ['Test requirement'],
        technologyStack: ['Test technology'],
        companyId: new mongoose.Types.ObjectId(),
        companyName: 'Test Company',
        status: 'Active',
        applicationLimit: 2, // Low limit for testing
        applicationsCount: 0
      });
      
      await testJob.save();
      console.log('✅ Test job created with ID:', testJob._id);
      console.log('📊 Application Limit:', testJob.applicationLimit);
      console.log('📊 Current Applications:', testJob.applicationsCount);
      return;
    }

    console.log('📋 Found job:', job.jobTitle);
    console.log('📊 Application Limit:', job.applicationLimit);
    console.log('📊 Current Applications:', job.applicationsCount);
    console.log('📊 Status:', job.status);

    // Check if job should be visible to students
    const shouldBeVisible = job.status === 'Active' && job.applicationsCount < job.applicationLimit;
    console.log('👁️  Should be visible to students:', shouldBeVisible ? 'YES' : 'NO');

    // Test the filter query that students use
    const visibleJobs = await Job.find({
      status: 'Active',
      $expr: { $lt: ['$applicationsCount', '$applicationLimit'] }
    });

    console.log('📱 Jobs visible to students:', visibleJobs.length);
    
    const isJobVisible = visibleJobs.some(j => j._id.toString() === job._id.toString());
    console.log('📱 This specific job visible:', isJobVisible ? 'YES' : 'NO');

    // Get applications for this job
    const applications = await Application.find({ jobId: job._id });
    console.log('📄 Actual applications in database:', applications.length);

    // Check for any discrepancies
    if (applications.length !== job.applicationsCount) {
      console.log('⚠️  WARNING: Application count mismatch!');
      console.log('   Database applications:', applications.length);
      console.log('   Job applicationsCount:', job.applicationsCount);
    }

    console.log('\n✅ Application Limit Feature Test Completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📶 Database connection closed');
  }
};

// Run the test
testApplicationLimit();