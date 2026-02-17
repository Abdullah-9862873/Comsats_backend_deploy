const mongoose = require('mongoose');

const offerLetterSchema = new mongoose.Schema({
  // Application reference
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: false
  },

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

  // Company information
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizationName: {
    type: String,
    required: true,
    default: 'Organization Name'
  },
  organizationAddress: {
    type: String,
    required: true,
    default: 'Organization Address'
  },
  representativeName: {
    type: String,
    required: true,
    default: 'Representative Name'
  },
  representativePosition: {
    type: String,
    required: true,
    default: 'Representative Position'
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
  
  // Supervisor information
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supervisorName: {
    type: String,
    required: true,
    default: 'Assigned Supervisor'
  },

  // Offer details
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  customMessage: {
    type: String,
    default: ''
  },

  // Generated offer letter content
  offerLetterContent: {
    type: String,
    required: true
  },

  // Status tracking
  status: {
    type: String,
    enum: ['sent', 'accepted', 'rejected'],
    default: 'sent'
  },

  // Student response
  studentResponse: {
    response: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    studentComments: {
      type: String,
      default: ''
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },

  // Timestamps
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
offerLetterSchema.index({ applicationId: 1 });
offerLetterSchema.index({ studentId: 1 });
offerLetterSchema.index({ companyId: 1 });
offerLetterSchema.index({ jobId: 1 });
offerLetterSchema.index({ supervisorId: 1 });
offerLetterSchema.index({ status: 1 });
offerLetterSchema.index({ sentAt: 1 });

module.exports = mongoose.model('OfferLetter', offerLetterSchema);