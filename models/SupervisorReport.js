const mongoose = require('mongoose');

const supervisorReportSchema = new mongoose.Schema({
  // Student information
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
  studentDetails: {
    registrationNumber: String,
    department: String,
    semester: String,
    profilePicture: String,
    rollNumber: String // Added roll number to student details
  },

  // Supervisor information
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supervisorName: {
    type: String,
    required: true
  },

  // Company information
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },

  // Job/Application reference
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },

  // Report details
  reportType: {
    type: String,
    enum: ['misconduct', 'appraisal', 'progress'],
    required: true
  },
  reportTitle: {
    type: String,
    required: true
  },
  reportText: {
    type: String,
    required: true
  },
  reportDate: {
    type: Date,
    default: Date.now
  },

  // Additional metadata
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
supervisorReportSchema.index({ studentId: 1 });
supervisorReportSchema.index({ supervisorId: 1 });
supervisorReportSchema.index({ companyId: 1 });
supervisorReportSchema.index({ applicationId: 1 });
supervisorReportSchema.index({ reportType: 1 });
supervisorReportSchema.index({ reportDate: -1 });
supervisorReportSchema.index({ isRead: 1 });

module.exports = mongoose.model('SupervisorReport', supervisorReportSchema);
