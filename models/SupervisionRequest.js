const mongoose = require('mongoose');

const supervisionRequestSchema = new mongoose.Schema({
  // Student information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
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
    default: 'N/A'
  },
  studentDepartment: {
    type: String,
    default: 'N/A'
  },
  studentSemester: {
    type: String,
    default: 'N/A'
  },
  studentCGPA: {
    type: String,
    default: 'N/A'
  },
  studentPhoneNumber: {
    type: String,
    default: 'N/A'
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

  // Request status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },

  // Request details
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  supervisorComments: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better query performance
supervisionRequestSchema.index({ studentId: 1 });
supervisionRequestSchema.index({ supervisorId: 1 });
supervisionRequestSchema.index({ status: 1 });

// Ensure a student can only have one active request per supervisor
supervisionRequestSchema.index({ studentId: 1, supervisorId: 1 }, { unique: true });

module.exports = mongoose.model('SupervisionRequest', supervisionRequestSchema);
