const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');

// Test route to create a job without authentication (for debugging only)
router.post('/test-create', async (req, res) => {
  console.log('=== TEST CREATE JOB API CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Get or create a test company
    let testCompany = await User.findOne({ email: 'testcompany@example.com' });
    
    if (!testCompany) {
      testCompany = new User({
        name: 'Test Company',
        email: 'testcompany@example.com',
        password: 'testpassword123',
        role: 'company',
        company: {
          companyName: 'Test Tech Solutions',
          industry: 'Technology',
          about: 'A test company for development purposes'
        }
      });
      await testCompany.save();
    }

    // Use default test data if no body provided
    const jobData = {
      jobTitle: req.body.jobTitle || 'Test Job Position',
      location: req.body.location || 'Test City',
      workType: req.body.workType || 'Remote',
      duration: req.body.duration || '6 months',
      salary: req.body.salary || 'Rs. 30,000/month',
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date('2025-08-01'),
      endDate: req.body.endDate ? new Date(req.body.endDate) : new Date('2026-02-01'),
      jobDescription: req.body.jobDescription || 'This is a test job description.',
      requirements: req.body.requirements || ['Test requirement 1', 'Test requirement 2'],
      technologyStack: req.body.technologyStack || ['JavaScript', 'React'],
      companyId: testCompany._id,
      companyName: testCompany.name,
      isUrgent: req.body.isUrgent || false,
      tags: req.body.tags || ['test', 'api']
    };

    console.log('Creating job with data:', JSON.stringify(jobData, null, 2));

    const job = new Job(jobData);
    const savedJob = await job.save();

    console.log('Job saved successfully:', savedJob._id);

    res.status(201).json({
      success: true,
      message: 'Test job created successfully',
      data: savedJob
    });

  } catch (error) {
    console.error('Error in test create:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test job',
      error: error.message
    });
  }
});

// Test route to get all jobs
router.get('/test-list', async (req, res) => {
  try {
    const jobs = await Job.find().populate('companyId', 'name email');
    const count = await Job.countDocuments();

    console.log(`Found ${count} jobs in database`);

    res.status(200).json({
      success: true,
      count,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
});

// Test route to clear all test jobs
router.delete('/test-clear', async (req, res) => {
  try {
    const result = await Job.deleteMany({});
    const userResult = await User.deleteMany({ email: 'testcompany@example.com' });

    console.log('Deleted jobs:', result.deletedCount);
    console.log('Deleted test users:', userResult.deletedCount);

    res.status(200).json({
      success: true,
      message: 'All test data cleared',
      deletedJobs: result.deletedCount,
      deletedUsers: userResult.deletedCount
    });
  } catch (error) {
    console.error('Error clearing test data:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing test data',
      error: error.message
    });
  }
});

module.exports = router;
