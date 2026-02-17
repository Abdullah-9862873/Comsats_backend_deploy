const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentRollNo: {
    type: String,
    required: true
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supervisorName: {
    type: String,
    required: true
  },
  weekEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyReportEvent',
    required: true
  },
  weekNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  weekStartDate: {
    type: Date,
    default: null
  },
  reportTitle: {
    type: String,
    required: true
  },
  // Student submission fields
  tasksCompleted: {
    type: String,
    required: true,
    trim: true
  },
  challengesFaced: {
    type: String,
    default: '',
    trim: true
  },
  reflections: {
    type: String,
    default: '',
    trim: true
  },
  supportingMaterials: {
    type: String,
    default: '',
    trim: true
  },
  // File uploads for supporting materials
  supportingFiles: [{
    filename: {
      type: String,
      required: true
    },
    originalname: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  plansForNextWeek: {
    type: String,
    default: '',
    trim: true
  },
  // Company information (auto-populated from student profile)
  companyName: {
    type: String,
    default: ''
  },
  companyLocation: {
    type: String,
    default: ''
  },
  // Status tracking
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'requires_revision'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // Supervisor feedback
  supervisorFeedback: {
    feedback: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: String,
      default: ''
    }
  },
  // Due date from the event
  dueDate: {
    type: Date,
    required: true
  },
  // Submission metadata
  submissionMetadata: {
    ipAddress: String,
    userAgent: String,
    submissionMethod: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
weeklyReportSchema.index({ studentId: 1, weekNumber: 1 });
weeklyReportSchema.index({ supervisorId: 1, weekNumber: 1 });
weeklyReportSchema.index({ weekEventId: 1 });
weeklyReportSchema.index({ status: 1 });
weeklyReportSchema.index({ submittedAt: 1 });

// Ensure unique submission per student per week event
weeklyReportSchema.index(
  { studentId: 1, weekEventId: 1 }, 
  { unique: true }
);

// Pre-save middleware
weeklyReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if submission is late
weeklyReportSchema.methods.isLateSubmission = function() {
  return this.submittedAt > this.dueDate;
};

// Method to check if review is pending
weeklyReportSchema.methods.isPendingReview = function() {
  return this.status === 'submitted';
};

// Method to get submission delay in days
weeklyReportSchema.methods.getSubmissionDelay = function() {
  if (!this.isLateSubmission()) return 0;
  const diffTime = Math.abs(this.submittedAt - this.dueDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Static method to get reports by supervisor
weeklyReportSchema.statics.getBySupervisor = function(supervisorId, options = {}) {
  const query = { supervisorId };
  
  if (options.weekNumber) {
    query.weekNumber = options.weekNumber;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('studentId', 'name email rollNumber')
    .populate('weekEventId', 'title instructions dueDate')
    .sort({ weekNumber: -1, submittedAt: -1 });
};

// Static method to get reports by student
weeklyReportSchema.statics.getByStudent = function(studentId, options = {}) {
  const query = { studentId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('supervisorId', 'name email')
    .populate('weekEventId', 'title instructions dueDate')
    .sort({ weekNumber: -1 });
};

// Virtual for report completion percentage (based on filled fields)
weeklyReportSchema.virtual('completionPercentage').get(function() {
  let filledFields = 0;
  const totalFields = 4; // tasksCompleted, challengesFaced, reflections, supportingMaterials
  
  if (this.tasksCompleted && this.tasksCompleted.trim()) filledFields++;
  if (this.challengesFaced && this.challengesFaced.trim()) filledFields++;
  if (this.reflections && this.reflections.trim()) filledFields++;
  if (this.supportingMaterials && this.supportingMaterials.trim()) filledFields++;
  
  return Math.round((filledFields / totalFields) * 100);
});

// Ensure virtual fields are included in JSON output
weeklyReportSchema.set('toJSON', { virtuals: true });
weeklyReportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);
