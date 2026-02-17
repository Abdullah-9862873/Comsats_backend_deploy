const mongoose = require('mongoose');
const Job = require('./models/Job');

// Script to add application deadlines to existing jobs
async function addApplicationDeadlinesToExistingJobs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/internship_portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all jobs without application deadline
    const jobsWithoutDeadline = await Job.find({
      $or: [
        { applicationDeadline: { $exists: false } },
        { applicationDeadline: null }
      ]
    });

    console.log(`📋 Found ${jobsWithoutDeadline.length} jobs without application deadline`);

    if (jobsWithoutDeadline.length === 0) {
      console.log('✅ All jobs already have application deadlines');
      return;
    }

    // Update each job
    for (let job of jobsWithoutDeadline) {
      let defaultDeadline;
      
      if (job.startDate) {
        // Set deadline to 3 days before start date, or tomorrow if start date is too soon
        const startDate = new Date(job.startDate);
        const threeDaysBefore = new Date(startDate.getTime() - (3 * 24 * 60 * 60 * 1000));
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        defaultDeadline = threeDaysBefore > tomorrow ? threeDaysBefore : tomorrow;
      } else {
        // If no start date, set deadline to 30 days from now
        defaultDeadline = new Date();
        defaultDeadline.setDate(defaultDeadline.getDate() + 30);
      }

      await Job.findByIdAndUpdate(job._id, {
        applicationDeadline: defaultDeadline
      });

      console.log(`✅ Updated job "${job.jobTitle}" with deadline: ${defaultDeadline.toLocaleDateString()}`);
    }

    console.log(`🎉 Successfully updated ${jobsWithoutDeadline.length} jobs with application deadlines`);

  } catch (error) {
    console.error('❌ Error updating jobs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

addApplicationDeadlinesToExistingJobs();