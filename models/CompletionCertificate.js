const mongoose = require('mongoose');

const completionCertificateSchema = new mongoose.Schema({
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
  studentEmail: {
    type: String,
    required: true
  },
  studentRollNumber: {
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
  companySupervisor: {
    type: String,
    required: true
  },
  supervisorEmail: {
    type: String,
    required: true
  },
  
  // Internship Details
  internshipStartDate: {
    type: Date,
    required: true
  },
  internshipEndDate: {
    type: Date,
    required: true
  },
  internshipDuration: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  
  // Final Report Content
  reportSummary: {
    type: String,
    required: true,
    minlength: [50, 'Report summary must be at least 50 characters long']
  },
  keyAchievements: {
    type: String,
    required: true,
    minlength: [30, 'Key achievements must be at least 30 characters long']
  },
  futurePlans: {
    type: String,
    required: true,
    minlength: [30, 'Future plans must be at least 30 characters long']
  },
  
  // Skills and Learning
  technicalSkills: {
    type: String,
    required: true
  },
  softSkills: {
    type: String,
    required: true
  },
  overallLearning: {
    type: String,
    required: true
  },
  
  // Performance and Evaluation
  projectsCompleted: {
    type: String,
    required: true
  },
  performanceRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  recommendationLetter: {
    type: String,
    required: true
  },
  
  // Documents
  certificateFile: {
    type: String, // File path
    required: true
  },
  appraisalForm: {
    type: String, // File path
    required: true
  },
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['submitted', 'under-review', 'approved', 'rejected'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Supervisor Feedback
  supervisorFeedback: {
    type: String
  },
  supervisorGrade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
  },
  supervisorComments: {
    type: String
  },
  
  // Administrative
  certificateNumber: {
    type: String,
    unique: true
  },
  issuedDate: {
    type: Date
  },
  validityDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate certificate number before saving
completionCertificateSchema.pre('save', function(next) {
  if (!this.certificateNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.certificateNumber = `CERT-${year}${month}-${random}`;
  }
  next();
});

// Calculate internship duration
completionCertificateSchema.pre('save', function(next) {
  if (this.internshipStartDate && this.internshipEndDate) {
    const start = new Date(this.internshipStartDate);
    const end = new Date(this.internshipEndDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    this.internshipDuration = `${weeks} weeks (${diffDays} days)`;
  }
  next();
});

module.exports = mongoose.model('CompletionCertificate', completionCertificateSchema);
