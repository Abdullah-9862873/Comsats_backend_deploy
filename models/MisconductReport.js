const mongoose = require('mongoose');

const misconductReportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: false
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyProfile',
    required: true
  },
  companyName: {
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
  issueType: {
    type: String,
    required: true,
    enum: ['Absenteeism', 'Unprofessional Behavior', 'Misconduct', 'Poor Performance', 'Policy Violation']
  },
  incidentDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 200
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved', 'Warning Issued', 'Internship Cancelled'],
    default: 'Pending'
  },
  supervisorComments: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MisconductReport', misconductReportSchema);