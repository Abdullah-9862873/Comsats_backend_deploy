const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
    // e.g., 'EMAIL_VERIFICATION_REQUIRED', 'MAX_APPLICATIONS_PER_STUDENT'
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
    // Can store string, number, boolean, object
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'general'
    // e.g., 'email', 'application', 'general', 'security'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);