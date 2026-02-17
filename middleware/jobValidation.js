// Validation middleware for job posting
const validateJobPost = (req, res, next) => {
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
    technologyStack
  } = req.body;

  // Check required fields
  const requiredFields = {
    jobTitle: 'Job title',
    location: 'Location',
    workType: 'Work type',
    duration: 'Duration',
    salary: 'Salary',
    startDate: 'Start date',
    endDate: 'End date',
    jobDescription: 'Job description',
    requirements: 'Requirements',
    technologyStack: 'Technology stack'
  };

  const missingFields = [];
  Object.keys(requiredFields).forEach(field => {
    if (!req.body[field] || (Array.isArray(req.body[field]) && req.body[field].length === 0)) {
      missingFields.push(requiredFields[field]);
    }
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  // Validate work type
  const validWorkTypes = ['On-site', 'Remote', 'Hybrid'];
  if (!validWorkTypes.includes(workType)) {
    return res.status(400).json({
      success: false,
      message: 'Work type must be one of: On-site, Remote, Hybrid'
    });
  }

  // Validate arrays
  if (!Array.isArray(requirements)) {
    return res.status(400).json({
      success: false,
      message: 'Requirements must be an array'
    });
  }

  if (!Array.isArray(technologyStack)) {
    return res.status(400).json({
      success: false,
      message: 'Technology stack must be an array'
    });
  }

  // Validate string lengths
  if (jobTitle.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Job title cannot exceed 100 characters'
    });
  }

  if (location.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Location cannot exceed 100 characters'
    });
  }

  if (jobDescription.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Job description cannot exceed 2000 characters'
    });
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format'
    });
  }

  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: 'End date must be after start date'
    });
  }

  if (start < today) {
    return res.status(400).json({
      success: false,
      message: 'Start date cannot be in the past'
    });
  }

  next();
};

// Validation middleware for job update (more flexible)
const validateJobUpdate = (req, res, next) => {
  const {
    workType,
    startDate,
    endDate,
    jobTitle,
    location,
    jobDescription,
    applicationLimit
  } = req.body;

  try {
    // Validate work type if provided
    if (workType) {
      const validWorkTypes = ['On-site', 'Remote', 'Hybrid'];
      if (!validWorkTypes.includes(workType)) {
        return res.status(400).json({
          success: false,
          message: 'Work type must be one of: On-site, Remote, Hybrid'
        });
      }
    }

    // Validate string lengths if provided
    if (jobTitle && jobTitle.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Job title cannot exceed 100 characters'
      });
    }

    if (location && location.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Location cannot exceed 100 characters'
      });
    }

    if (jobDescription && jobDescription.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Job description cannot exceed 2000 characters'
      });
    }

    // Validate application limit if provided
    if (applicationLimit !== undefined) {
      const limit = parseInt(applicationLimit);
      if (isNaN(limit) || limit < 1) {
        return res.status(400).json({
          success: false,
          message: 'Application limit must be a number greater than 0'
        });
      }
    }

    // Validate dates if both are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    next();

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }
};

module.exports = {
  validateJobPost,
  validateJobUpdate
};
