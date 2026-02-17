const mongoose = require('mongoose');

const joiningReportSchema = new mongoose.Schema({
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
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  position: {
    type: String,
    default: 'Not Specified'
  },
  department: {
    type: String,
    default: 'N/A'
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
  supervisorEmail: {
    type: String,
    required: true
  },
  internshipStart: {
    type: Date,
    required: true
  },
  internshipEnd: {
    type: Date,
    required: true
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  studentThoughts: {
    type: String,
    required: true,
    minlength: 10
  },
  acknowledgment: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['Pending Review', 'Verified'],
    default: 'Pending Review'
  }
}, {
  timestamps: true
});

joiningReportSchema.index({ studentId: 1 });
joiningReportSchema.index({ supervisorId: 1 });
joiningReportSchema.index({ companyId: 1 });

module.exports = mongoose.model('JoiningReport', joiningReportSchema);