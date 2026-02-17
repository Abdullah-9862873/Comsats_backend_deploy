const mongoose = require('mongoose');

const internshipAppraisalSchema = new mongoose.Schema({
  // Student Information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String
  },
  internshipTitle: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  
  // Company Information
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  
  // Performance Evaluation
  overallPerformance: {
    type: String,
    required: true,
    enum: ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Poor']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  keyStrengths: {
    type: String,
    required: true,
    minlength: 10
  },
  areasForImprovement: {
    type: String,
    required: true,
    minlength: 10
  },
  
  // Feedback
  commentsAndFeedback: {
    type: String,
    required: true,
    minlength: 50
  },
  recommendation: {
    type: String,
    required: true,
    enum: ['Highly Recommend', 'Recommend', 'Neutral', 'Do Not Recommend']
  },
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Submission Details
  submittedBy: {
    type: String,
    required: true
  },
  submittedByEmail: {
    type: String,
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  
  // Status
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'archived'],
    default: 'submitted'
  },
  
  // Review Information (for future use)
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  reviewComments: String
}, {
  timestamps: true
});

// Index for efficient queries
internshipAppraisalSchema.index({ companyId: 1, submissionDate: -1 });
internshipAppraisalSchema.index({ studentId: 1 });
internshipAppraisalSchema.index({ status: 1 });

module.exports = mongoose.model('InternshipAppraisal', internshipAppraisalSchema);
