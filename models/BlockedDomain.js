const mongoose = require('mongoose');

const blockedDomainSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
    // e.g., 'tempmail.com', '10minutemail.com'
  },
  reason: {
    type: String,
    default: 'Temporary email service'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  blockedCount: {
    type: Number,
    default: 0
    // Track how many times this domain was blocked
  }
}, {
  timestamps: true
});

// Index for efficient email validation
blockedDomainSchema.index({ domain: 1, isActive: 1 });

module.exports = mongoose.model('BlockedDomain', blockedDomainSchema);