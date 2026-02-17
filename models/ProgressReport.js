const mongoose = require('mongoose');

const progressReportSchema = new mongoose.Schema({
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
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  reportingPeriod: {
    type: String,
    required: true
  },
  tasksAssigned: {
    type: String,
    required: true
  },
  progressMade: {
    type: String,
    required: true
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  qualityOfWork: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Poor'],
    required: true
  },
  areasOfImprovement: {
    type: String,
    default: ''
  },
  nextGoals: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  },
  reportType: {
    type: String,
    default: 'Progress'
  },
  status: {
    type: String,
    enum: ['Submitted', 'Reviewed'],
    default: 'Submitted'
  },
  supervisorFeedback: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProgressReport', progressReportSchema);