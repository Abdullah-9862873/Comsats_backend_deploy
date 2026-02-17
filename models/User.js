const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'company', 'supervisor', 'admin'],
    required: true,
  },
  avatar: {
    type: String,
    default: 'https://example.com/default-avatar.jpg',
  },
  // Email verification fields
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpires: {
    type: Date,
  },
  lastVerificationEmailSent: {
    type: Date,
  },
  // Password reset fields
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  lastPasswordResetEmailSent: {
    type: Date,
  },
  company: {
    companyName: String,
    industry: String,
    website: String,
    about: String,
  },
  student: {
    department: String,
    semester: String,
    regNo: String,
  },
  supervisor: {
    department: String,
    designation: String,
    maxStudents: {
      type: Number,
      default: 10
    },
    currentStudents: {
      type: Number,
      default: 0
    },
    expertise: {
      type: [String],
      default: []
    },
    phone: String,
    office: String,
    officeHours: {
      type: String,
      default: 'Mon-Fri, 9AM-5PM'
    },
    assignedStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);