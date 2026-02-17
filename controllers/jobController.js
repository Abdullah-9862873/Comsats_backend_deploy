const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private (Company only)
const createJob = async (req, res) => {
  console.log('=== CREATE JOB API CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID:', req.user?.id);
  console.log('User role:', req.user?.role);

  try {
    const {
      jobTitle,
      location,
      workType,
      duration,
      salary,
      startDate,
      endDate,
      jobDescription,
      requirements,
      technologyStack,
      applicationDeadline,
      isUrgent,
      tags
    } = req.body;

    // Validate required fields
    if (!jobTitle || !location || !workType || !duration || !salary || 
        !startDate || !endDate || !jobDescription || !requirements || !technologyStack || 
        !req.body.applicationLimit || !applicationDeadline) {
      console.log('Missing required fields validation failed');
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        missingFields: {
          jobTitle: !jobTitle,
          location: !location,
          workType: !workType,
          duration: !duration,
          salary: !salary,
          startDate: !startDate,
          endDate: !endDate,
          jobDescription: !jobDescription,
          requirements: !requirements,
          technologyStack: !technologyStack,
          applicationLimit: !req.body.applicationLimit,
          applicationDeadline: !applicationDeadline
        }
      });
    }

    // Validate application limit
    const applicationLimit = parseInt(req.body.applicationLimit);
    if (isNaN(applicationLimit) || applicationLimit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Application limit must be a number greater than 0'
      });
    }

    // Validate arrays
    if (!Array.isArray(requirements) || requirements.length === 0) {
      console.log('Requirements array validation failed:', requirements);
      return res.status(400).json({
        success: false,
        message: 'At least one requirement must be provided'
      });
    }

    if (!Array.isArray(technologyStack) || technologyStack.length === 0) {
      console.log('Technology stack array validation failed:', technologyStack);
      return res.status(400).json({
        success: false,
        message: 'At least one technology must be provided'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log('Date validation - Start:', start, 'End:', end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log('Invalid date format');
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }
    
    if (start >= end) {
      console.log('Date range validation failed');
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check if start date is not in the past (allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    if (start < today) {
      console.log('Start date in past validation failed');
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    // Validate application deadline
    const deadline = new Date(applicationDeadline);
    console.log('Application deadline validation:', deadline);

    if (isNaN(deadline.getTime())) {
      console.log('Invalid application deadline format');
      return res.status(400).json({
        success: false,
        message: 'Invalid application deadline format. Please use YYYY-MM-DD format.'
      });
    }

    if (deadline <= new Date()) {
      console.log('Application deadline in past validation failed');
      return res.status(400).json({
        success: false,
        message: 'Application deadline must be in the future'
      });
    }

    if (deadline >= start) {
      console.log('Application deadline after start date validation failed');
      return res.status(400).json({
        success: false,
        message: 'Application deadline must be before the job start date'
      });
    }

    // Get company information from authenticated user
    console.log('Fetching company information for user ID:', req.user.id);
    const company = await User.findById(req.user.id);
    
    if (!company) {
      console.log('Company not found in database');
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    if (company.role !== 'company') {
      console.log('User role validation failed. Role:', company.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Company account required.'
      });
    }

    // Fetch company profile to get the actual company name
    const CompanyProfile = require('../models/CompanyProfile');
    const companyProfile = await CompanyProfile.findOne({ user: req.user.id });
    
    console.log('Company found:', company.name, company.email);
    console.log('Company profile found:', companyProfile?.companyName);

    // Create job posting
    const jobData = {
      jobTitle: jobTitle.trim(),
      location: location.trim(),
      workType,
      duration: duration.trim(),
      salary: salary.trim(),
      startDate: start,
      endDate: end,
      jobDescription: jobDescription.trim(),
      requirements: requirements.map(req => req.trim()).filter(req => req),
      technologyStack: technologyStack.map(tech => tech.trim()).filter(tech => tech),
      companyId: req.user.id,
      companyName: companyProfile?.companyName || company.name || 'Unknown Company',
      applicationLimit: applicationLimit,
      applicationDeadline: deadline,
      isUrgent: isUrgent || false,
      tags: tags ? tags.map(tag => tag.trim()).filter(tag => tag) : []
    };

    console.log('Creating job with data:', JSON.stringify(jobData, null, 2));

    const job = new Job(jobData);
    
    console.log('Job instance created, attempting to save...');
    const savedJob = await job.save();
    
    console.log('Job saved successfully with ID:', savedJob._id);

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: savedJob
    });

  } catch (error) {
    console.error('=== ERROR IN CREATE JOB ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating job posting',
      error: error.message
    });
  }
};

// @desc    Get all jobs for a company
// @route   GET /api/jobs/company
// @access  Private (Company only)
const getCompanyJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = { companyId: req.user.id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch jobs with pagination
    const jobs = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Job.countDocuments(filter);

    // Get active jobs count for dashboard
    const activeJobsCount = await Job.countDocuments({ 
      companyId: req.user.id, 
      status: 'Active' 
    });

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      },
      activeJobsCount
    });

  } catch (error) {
    console.error('Error fetching company jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs',
      error: error.message
    });
  }
};

// @desc    Get all active jobs (public)
// @route   GET /api/jobs
// @access  Public
const getAllJobs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      location = '', 
      workType = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build filter for active jobs only and not reached application limit
    const filter = { 
      status: 'Active',
      $expr: { $lt: ['$applicationsCount', '$applicationLimit'] }
    };

    // Add search filter
    if (search) {
      filter.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { jobDescription: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }

    // Add location filter
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Add work type filter
    if (workType && workType !== 'all') {
      filter.workType = workType;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch jobs with pagination
    const jobs = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .populate('companyId', 'name companyName email')
      .lean();

    // Fetch company profiles for all jobs
    const CompanyProfile = require('../models/CompanyProfile');
    const companyIds = jobs.map(job => job.companyId?._id).filter(Boolean);
    const companyProfiles = await CompanyProfile.find({ user: { $in: companyIds } })
      .select('user about industry website employeeCount vision mission headquartersLocation foundedYear')
      .lean();
    
    // Create a map of userId to profile
    const profileMap = {};
    companyProfiles.forEach(profile => {
      profileMap[profile.user.toString()] = profile;
    });

    // Rename companyId to createdBy and attach company profile
    const jobsWithCreatedBy = jobs.map(job => ({
      ...job,
      createdBy: {
        ...job.companyId,
        companyProfile: job.companyId ? profileMap[job.companyId._id.toString()] : null
      },
      companyId: job.companyId?._id
    }));

    // Get total count for pagination
    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: jobsWithCreatedBy,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs',
      error: error.message
    });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name companyName email phone address')
      .select('-__v');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment views count
    await Job.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    res.status(200).json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job',
      error: error.message
    });
  }
};

// @desc    Update job posting
// @route   PUT /api/jobs/:id
// @access  Private (Company only)
const updateJob = async (req, res) => {
  try {
    console.log('=== UPDATE JOB API CALLED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Job ID:', req.params.id);
    console.log('User ID:', req.user?.id);

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if the job belongs to the authenticated company
    if (job.companyId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own job postings.'
      });
    }

    // Handle application limit specifically
    if (req.body.applicationLimit !== undefined) {
      const applicationLimit = parseInt(req.body.applicationLimit);
      console.log('Processing application limit:', applicationLimit);
      
      if (isNaN(applicationLimit) || applicationLimit < 1) {
        return res.status(400).json({
          success: false,
          message: 'Application limit must be a number greater than 0'
        });
      }
      
      req.body.applicationLimit = applicationLimit;

      // Check if job should be reopened due to increased limit
      if (job.status === 'Closed' && job.applicationsCount < applicationLimit) {
        req.body.status = 'Active';
        console.log(`Job ${job._id} reopened - application limit increased from ${job.applicationLimit} to ${applicationLimit}`);
      }
    }

    // Simple date validation
    if (req.body.startDate && req.body.endDate) {
      const start = new Date(req.body.startDate);
      const end = new Date(req.body.endDate);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    console.log('About to update job with data:', req.body);

    // Update job with minimal validation
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true, context: 'query' } // Re-enable validators but use query context
    );

    console.log('Job updated successfully:', updatedJob._id);

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });

  } catch (error) {
    console.error('Error updating job:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating job',
      error: error.message,
      details: error.stack
    });
  }
};

// @desc    Delete job posting
// @route   DELETE /api/jobs/:id
// @access  Private (Company only)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if the job belongs to the authenticated company
    if (job.companyId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own job postings.'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting job',
      error: error.message
    });
  }
};

// @desc    Get job statistics for company dashboard
// @route   GET /api/jobs/stats/company
// @access  Private (Company only)
const getCompanyJobStats = async (req, res) => {
  try {
    const companyId = req.user.id;

    // Get job statistics
    const totalJobs = await Job.countDocuments({ companyId });
    const activeJobs = await Job.countDocuments({ companyId, status: 'Active' });
    const inactiveJobs = await Job.countDocuments({ companyId, status: 'Inactive' });
    const closedJobs = await Job.countDocuments({ companyId, status: 'Closed' });

    // Get total applications count (you'll need to implement Application model later)
    // const totalApplications = await Application.countDocuments({ companyId });

    // Get recent jobs
    const recentJobs = await Job.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('jobTitle status createdAt applicationsCount viewsCount');

    res.status(200).json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        inactiveJobs,
        closedJobs,
        // totalApplications,
        recentJobs
      }
    });

  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job statistics',
      error: error.message
    });
  }
};

module.exports = {
  createJob,
  getCompanyJobs,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getCompanyJobStats
};
