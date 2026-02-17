const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
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
  
  // Additional student profile details
  studentProfile: {
    rollNumber: {
      type: String,
      default: null
    },
    department: {
      type: String,
      required: true
    },
    semester: {
      type: String,
      required: true
    },
    cgpa: {
      type: Number,
      default: null
    },
    phoneNumber: {
      type: String,
      default: null
    },
    attendance: {
      type: Number,
      default: null
    },
    backlogs: {
      type: Number,
      default: 0
    },
    // CV information
    cv: {
      filename: {
        type: String,
        default: null
      },
      originalName: {
        type: String,
        default: null
      },
      path: {
        type: String,
        default: null
      },
      size: {
        type: Number,
        default: null
      },
      uploadedAt: {
        type: Date,
        default: null
      }
    },
    // Certificates information
    certificates: [{
      filename: {
        type: String,
        required: true
      },
      originalName: {
        type: String,
        required: true
      },
      path: {
        type: String,
        required: true
      },
      size: {
        type: Number,
        required: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Job information
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobTitle: {
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

  // Application details
  coverLetter: {
    type: String,
    required: true
  },

  // Status flow: pending -> supervisor_approved/supervisor_rejected -> company_approved/company_rejected
  supervisorStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  companyStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  overallStatus: {
    type: String,
    enum: ['pending_supervisor', 'supervisor_changes_requested', 'resubmitted_to_supervisor', 'supervisor_approved', 'pending_company', 'approved', 'rejected', 'rejected_final'],
    default: 'pending_supervisor'
  },

  // Extended status flow for interview and hiring process
  applicationStatus: {
    type: String,
    enum: ['pending', 'interview_scheduled', 'interview_done', 'hired', 'rejected'],
    default: 'pending'
  },

  // Rejection feedback for resubmission flow
  rejectionFeedback: {
    type: {
      reason: String,
      details: String,
      requestedFixes: [String],
      fieldsToEdit: [String],
      bySupervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      at: {
        type: Date,
        default: Date.now
      }
    },
    required: false,
    default: null
  },

  // Revision history for resubmissions
  revisions: [{
    type: {
      type: String,
      enum: ['initial', 'resubmission'],
      default: 'initial'
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    note: {
      type: String,
      default: ''
    },
    at: {
      type: Date,
      default: Date.now
    }
  }],

  // Interview details
  interviewDetails: {
    type: {
      type: String,
      enum: ['remote', 'in-person'],
    },
    date: Date,
    time: String,
    location: String, // For in-person interviews
    meetingLink: String, // For remote interviews
    notes: String
  },

  // Hiring details
  hiringDate: Date,
  isCurrentlyHired: {
    type: Boolean,
    default: false
  },
  
  // Internship period details (added for completion certificates)
  startDate: Date,
  endDate: Date,
  department: String,
  jobPosition: String,

  // Review comments
  supervisorComments: {
    type: String,
    default: ''
  },
  companyComments: {
    type: String,
    default: ''
  },
  rejectionNote: {
    type: String,
    default: ''
  },
  companyRejectionNote: {
    type: String,
    default: ''
  },

  // Timestamps for each action
  appliedAt: {
    type: Date,
    default: Date.now
  },
  supervisorReviewedAt: {
    type: Date
  },
  companyReviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
applicationSchema.index({ studentId: 1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ companyId: 1 });
applicationSchema.index({ supervisorId: 1 });
applicationSchema.index({ supervisorStatus: 1 });
applicationSchema.index({ companyStatus: 1 });
applicationSchema.index({ overallStatus: 1 });
applicationSchema.index({ applicationStatus: 1 });
applicationSchema.index({ isCurrentlyHired: 1 });

module.exports = mongoose.model('Application', applicationSchema);
