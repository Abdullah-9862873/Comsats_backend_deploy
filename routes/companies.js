const express = require('express');
const router = express.Router();
const CompanyProfile = require('../models/CompanyProfile');
const Job = require('../models/Job');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get all registered companies with their profiles
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 Fetching all registered companies with complete profiles...');
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || '';
    const industry = req.query.industry || '';
    const location = req.query.location || '';
    const companySize = req.query.companySize || '';
    const hasActiveJobs = req.query.hasActiveJobs === 'true';

    console.log('📋 Query params:', { page, limit, search, industry, location, companySize, hasActiveJobs });

    // Build query filter - ONLY show companies with 100% profile completion
    let query = {
      profileCompleteness: 100  // Only show companies with complete profiles
    };
    
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (industry) {
      query.industry = industry;
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (companySize) {
      query.companySize = companySize;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get companies with pagination
    const companies = await CompanyProfile.find(query)
      .populate('user', 'name email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCompanies = await CompanyProfile.countDocuments(query);
    const totalPages = Math.ceil(totalCompanies / limit);

    // Add job counts to companies
    const companiesWithJobCounts = await Promise.all(
      companies.map(async (company) => {
        const jobCount = await Job.countDocuments({ 
          companyId: company.user._id,
          status: 'Active'
        });
        
        return {
          ...company,
          activeJobsCount: jobCount
        };
      })
    );

    // Filter by hasActiveJobs if specified
    let filteredCompanies = companiesWithJobCounts;
    if (hasActiveJobs) {
      filteredCompanies = companiesWithJobCounts.filter(company => company.activeJobsCount > 0);
    }

    console.log(`✅ Found ${filteredCompanies.length} registered companies (page ${page}/${totalPages})`);

    res.json({
      success: true,
      data: {
        companies: filteredCompanies,
        totalPages,
        currentPage: page,
        totalCompanies: hasActiveJobs ? filteredCompanies.length : totalCompanies,
        limit
      }
    });
  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get a specific company by ID with full details
router.get('/:companyId', auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log(`📋 Fetching company details for ID: ${companyId}`);

    const company = await CompanyProfile.findOne({
      _id: companyId,
      profileCompleteness: 100  // Only show companies with complete profiles
    }).populate('user', 'name email createdAt');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found or profile incomplete'
      });
    }

    console.log(`✅ Found company: ${company.companyName} (${company.profileCompleteness}% complete)`);

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('❌ Error fetching company details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all jobs posted by a specific company
router.get('/:companyId/jobs', auth, async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log(`📋 Fetching jobs for company ID: ${companyId}`);

    // First get the company profile to get the user ID - only companies with complete profiles
    const company = await CompanyProfile.findOne({
      _id: companyId,
      profileCompleteness: 100  // Only show jobs from companies with complete profiles
    });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found or profile incomplete'
      });
    }

    // Fetch jobs posted by this company
    const jobs = await Job.find({ 
      companyId: company.user._id,
      status: 'Active'
    })
    .populate('companyId', 'name email')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${jobs.length} jobs for company: ${company.companyName} (${company.profileCompleteness}% complete)`);

    res.json({
      success: true,
      data: jobs,
      company: {
        id: company._id,
        name: company.companyName,
        logo: company.logoImage
      },
      count: jobs.length
    });
  } catch (error) {
    console.error('❌ Error fetching company jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Search companies and jobs
router.get('/search/all', auth, async (req, res) => {
  try {
    const { 
      query = '', 
      industry = '', 
      location = '', 
      jobType = '',
      salaryRange = '',
      skills = '',
      page = 1,
      limit = 10 
    } = req.query;

    console.log('🔍 Searching companies and jobs with filters:', {
      query, industry, location, jobType, salaryRange, skills
    });

    // Build company search filter
    const companyFilter = {};
    if (query) {
      companyFilter.$or = [
        { companyName: { $regex: query, $options: 'i' } },
        { industry: { $regex: query, $options: 'i' } },
        { about: { $regex: query, $options: 'i' } }
      ];
    }
    if (industry) {
      companyFilter.industry = { $regex: industry, $options: 'i' };
    }
    if (location) {
      companyFilter.$or = [
        ...(companyFilter.$or || []),
        { address: { $regex: location, $options: 'i' } },
        { headquartersLocation: { $regex: location, $options: 'i' } }
      ];
    }

    // Search companies
    const companies = await CompanyProfile.find(companyFilter)
      .populate('user', 'name email')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    // Build job search filter
    const jobFilter = { status: { $in: ['active', 'Active'] } };
    if (query) {
      jobFilter.$or = [
        { jobTitle: { $regex: query, $options: 'i' } },
        { jobDescription: { $regex: query, $options: 'i' } },
        { requirements: { $regex: query, $options: 'i' } }
      ];
    }
    if (location) {
      jobFilter.location = { $regex: location, $options: 'i' };
    }
    if (jobType) {
      jobFilter.workType = { $regex: jobType, $options: 'i' };
    }
    if (skills) {
      jobFilter.technologyStack = { $regex: skills, $options: 'i' };
    }
    if (salaryRange && salaryRange !== 'any') {
      if (salaryRange === 'paid') {
        jobFilter.salary = { $ne: 'Unpaid', $ne: '0', $ne: '' };
      } else if (salaryRange === 'unpaid') {
        jobFilter.$or = [
          { salary: 'Unpaid' },
          { salary: '0' },
          { salary: '' },
          { salary: { $exists: false } }
        ];
      }
    }

    // Search jobs
    const jobs = await Job.find(jobFilter)
      .populate('postedBy', 'name email')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    console.log(`✅ Search results: ${companies.length} companies, ${jobs.length} jobs`);

    res.json({
      success: true,
      data: {
        companies,
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCompanies: await CompanyProfile.countDocuments(companyFilter),
          totalJobs: await Job.countDocuments(jobFilter)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error searching companies and jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching companies and jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
