const mongoose = require('mongoose');

const weeklyReportEventSchema = new mongoose.Schema({
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supervisorName: {
    type: String,
    required: true
  },
  weekNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  title: {
    type: String,
    default: function() {
      return `Weekly Report - Week ${this.weekNumber}`;
    }
  },
  instructions: {
    type: String,
    default: ''
  },
  weekStartDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  notifiedStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    notificationDate: Date
  }],
  createdAt: {
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

// Index for efficient queries
weeklyReportEventSchema.index({ supervisorId: 1, weekNumber: 1 });
weeklyReportEventSchema.index({ dueDate: 1 });
weeklyReportEventSchema.index({ status: 1 });

// Ensure unique week number per supervisor
weeklyReportEventSchema.index(
  { supervisorId: 1, weekNumber: 1 }, 
  { unique: true }
);

// Pre-save middleware to update the updatedAt field
weeklyReportEventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if event is expired
weeklyReportEventSchema.methods.isExpired = function() {
  return new Date() > this.dueDate;
};

// Static method to get active events for a supervisor
weeklyReportEventSchema.statics.getActiveBySupervisor = function(supervisorId) {
  return this.find({
    supervisorId: supervisorId,
    status: 'active'
  }).sort({ weekNumber: 1 });
};

// Static method to get events requiring student submissions
weeklyReportEventSchema.statics.getPendingForStudent = function(supervisorId) {
  return this.find({
    supervisorId: supervisorId,
    status: 'active',
    dueDate: { $gte: new Date() }
  }).sort({ dueDate: 1 });
};

module.exports = mongoose.model('WeeklyReportEvent', weeklyReportEventSchema);
