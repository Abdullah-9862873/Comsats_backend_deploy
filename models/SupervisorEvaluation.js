const mongoose = require('mongoose');

const supervisorEvaluationSchema = new mongoose.Schema({
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
  studentRegistration: {
    type: String,
    required: true
  },
  
  // Supervisor Information
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supervisorName: {
    type: String,
    required: true
  },
  
  // Internship Information
  internshipDuration: {
    type: String,
    required: true
  },
  internshipStartDate: {
    type: Date,
    required: true
  },
  internshipEndDate: {
    type: Date,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  
  // Evaluation Criteria (1-10 scale)
  platformActivity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  completionOfInternship: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  earningsAchieved: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  skillDevelopment: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  clientRating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  professionalism: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  
  // Calculated fields
  totalMarks: {
    type: Number,
    required: true,
    min: 6,
    max: 60
  },
  grade: {
    type: String,
    required: true,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  // Final Result Status Tracking
  finalResultSent: {
    type: Boolean,
    default: false
  },
  finalResultSentAt: {
    type: Date
  },
  finalResultSentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'finalized'],
    default: 'submitted'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
supervisorEvaluationSchema.index({ studentId: 1, supervisorId: 1 }, { unique: true });
supervisorEvaluationSchema.index({ supervisorId: 1, submittedAt: -1 });
supervisorEvaluationSchema.index({ status: 1 });
supervisorEvaluationSchema.index({ finalResultSent: 1, supervisorId: 1 });

module.exports = mongoose.model('SupervisorEvaluation', supervisorEvaluationSchema);
