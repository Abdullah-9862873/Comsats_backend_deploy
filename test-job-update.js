const mongoose = require('mongoose');
const Job = require('./models/Job');

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

const testJobUpdate = async () => {
  try {
    await connectDB();

    console.log('\n🧪 Testing Job Update with Application Limit\n');

    // Find any job to test update
    const job = await Job.findOne();
    
    if (!job) {
      console.log('❌ No job found for testing');
      return;
    }

    console.log('📋 Found job:', job.jobTitle);
    console.log('📊 Current Application Limit:', job.applicationLimit);
    console.log('📊 Current Applications:', job.applicationsCount);

    // Test updating just the application limit
    const newLimit = (job.applicationLimit || 50) + 10;
    
    console.log('\n🔄 Attempting to update application limit to:', newLimit);

    try {
      const updatedJob = await Job.findByIdAndUpdate(
        job._id,
        { applicationLimit: newLimit },
        { new: true, runValidators: false }
      );

      console.log('✅ Job updated successfully!');
      console.log('📊 New Application Limit:', updatedJob.applicationLimit);
      
      // Check if status changed
      if (job.status !== updatedJob.status) {
        console.log('📊 Status changed from', job.status, 'to', updatedJob.status);
      }

    } catch (updateError) {
      console.error('❌ Error updating job:', updateError.message);
      console.error('Error details:', updateError);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📶 Database connection closed');
  }
};

// Run the test
testJobUpdate();