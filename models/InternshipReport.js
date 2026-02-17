const mongoose = require('mongoose');

const internshipReportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Report Content
  acknowledgement: {
    type: String,
    required: true
  },
  executiveSummary: {
    type: String,
    required: true
  },
  tableOfContents: {
    type: String,
    required: true
  },
  
  // Work Samples / Project Summaries
  projectRequirements: {
    type: String,
    required: true
  },
  approachAndTools: {
    type: String,
    required: true
  },
  outcomesAchieved: {
    type: String,
    required: true
  },
  
  // Learning Experiences
  knowledgeAcquired: {
    type: String,
    required: true
  },
  skillsLearned: {
    type: String,
    required: true
  },
  attitudesAndValues: {
    type: String,
    required: true
  },
  challengingTask: {
    type: String,
    required: true
  },
  challengesAndSolutions: {
    type: String,
    required: true
  },
  reflectionAndConclusion: {
    type: String,
    required: true
  },
  
  // Supporting Documents
  appendices: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'approved'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  supervisorFeedback: {
    type: String
  },
  grade: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
internshipReportSchema.index({ studentId: 1 });
internshipReportSchema.index({ supervisorId: 1 });
internshipReportSchema.index({ companyId: 1 });
internshipReportSchema.index({ status: 1 });

module.exports = mongoose.model('InternshipReport', internshipReportSchema);
