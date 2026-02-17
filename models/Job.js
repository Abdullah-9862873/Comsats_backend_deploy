const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: function() {
      return this.isNew; // Only required for new documents
    },
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: function() {
      return this.isNew; // Only required for new documents
    },
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  workType: {
    type: String,
    required: function() {
      return this.isNew; // Only required for new documents
    },
    enum: {
      values: ['On-site', 'Remote', 'Hybrid'],
      message: 'Work type must be On-site, Remote, or Hybrid'
    },
    default: 'On-site'
  },
  duration: {
    type: String,
    required: function() {
      return this.isNew; // Only required for new documents
    },
    trim: true,
    maxlength: [50, 'Duration cannot exceed 50 characters']
  },
  salary: {
    type: String,
    required: function() {
      return this.isNew; // Only required for new documents
    },
    trim: true,
    maxlength: [50, 'Salary cannot exceed 50 characters']
  },
  startDate: {
    type: Date,
    required: function() {
      return this.isNew; // Only required for new documents
    }
  },
  endDate: {
    type: Date,
    required: function() {
      return this.isNew; // Only required for new documents
    },
    validate: {
      validator: function(value) {
        return !this.startDate || value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  jobDescription: {
    type: String,
    required: function() {
      return this.isNew; // Only required for new documents
    },
    trim: true,
    maxlength: [2000, 'Job description cannot exceed 2000 characters']
  },
  requirements: {
    type: [String],
    required: function() {
      return this.isNew; // Only required for new documents
    },
    validate: {
      validator: function(arr) {
        return !this.isNew || (Array.isArray(arr) && arr.length > 0);
      },
      message: 'At least one requirement must be provided'
    }
  },
  technologyStack: {
    type: [String],
    required: function() {
      return this.isNew; // Only required for new documents
    },
    validate: {
      validator: function(arr) {
        return !this.isNew || (Array.isArray(arr) && arr.length > 0);
      },
      message: 'At least one technology must be provided'
    }
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Company ID is required']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'Closed', 'Draft'],
      message: 'Status must be Active, Inactive, Closed, or Draft'
    },
    default: 'Active'
  },
  applicationsCount: {
    type: Number,
    default: 0,
    min: [0, 'Applications count cannot be negative']
  },
  applicationLimit: {
    type: Number,
    required: false, // Make it not required for updates
    min: [1, 'Application limit must be at least 1'],
    default: 50 // Default limit for existing jobs
  },
  viewsCount: {
    type: Number,
    default: 0,
    min: [0, 'Views count cannot be negative']
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  applicationDeadline: {
    type: Date,
    required: function() {
      return this.isNew; // Only required for new documents
    },
    validate: {
      validator: function(date) {
        if (!this.isNew) return true; // Skip validation for updates
        return date && date > new Date(); // Deadline must be in the future
      },
      message: 'Application deadline must be in the future'
    }
  }
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

// Pre-save middleware for logging
jobSchema.pre('save', function(next) {
  console.log('Attempting to save job:', this.jobTitle);
  console.log('Job data:', JSON.stringify(this.toObject(), null, 2));
  next();
});

// Post-save middleware for logging
jobSchema.post('save', function(doc) {
  console.log('Job saved successfully:', doc._id);
  console.log('Saved job title:', doc.jobTitle);
});

// Error handling middleware
jobSchema.post('save', function(error, doc, next) {
  if (error) {
    console.error('Error saving job:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
  }
  next(error);
});

// Index for better search performance
jobSchema.index({ jobTitle: 'text', jobDescription: 'text', location: 'text' });
jobSchema.index({ companyId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual for job duration in days
jobSchema.virtual('durationInDays').get(function() {
  if (this.startDate && this.endDate) {
    const timeDiff = this.endDate - this.startDate;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Ensure virtual fields are serialized
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
