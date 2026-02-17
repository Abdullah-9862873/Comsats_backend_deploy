const mongoose = require('mongoose');

const interneeEvaluationSchema = new mongoose.Schema({
  internId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  evaluation: {
    punctualityAndAttendance: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    abilityToLinkTheoryToPractice: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    demonstratedCriticalThinking: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    technicalKnowledge: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    creativityConceptualAbility: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    abilityToAdaptToVarietyOfTasks: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    timeManagementDeadlineCompliance: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    behavedInProfessionalManner: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    effectivelyPerformedAssignments: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    oralWrittenCommunicationSkills: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    totalMarks: {
      type: Number,
      required: true
    },
    maxMarks: {
      type: Number,
      default: 40
    },
    supervisorComments: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  submittedAt: {
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

// Indexes for better performance
interneeEvaluationSchema.index({ internId: 1, companyId: 1 });
interneeEvaluationSchema.index({ submittedAt: -1 });

// Virtual for percentage calculation
interneeEvaluationSchema.virtual('percentage').get(function() {
  return ((this.evaluation.totalMarks / this.evaluation.maxMarks) * 100).toFixed(2);
});

// Virtual for grade calculation
interneeEvaluationSchema.virtual('grade').get(function() {
  const percentage = (this.evaluation.totalMarks / this.evaluation.maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  return 'F';
});

module.exports = mongoose.model('InterneeEvaluation', interneeEvaluationSchema);
