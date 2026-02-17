const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Non-editable fields after registration
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Computer Science', 'Software Engineering', 'Information Technology', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration', 'Management Sciences', 'Mathematics', 'Physics', 'Chemistry'],
    trim: true
  },
  semester: {
    type: String,
    required: true,
    enum: ['5th', '6th', '7th', '8th'],
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },

  // Editable profile fields
  profilePicture: {
    type: String,
    default: null, // Will store the file path/URL
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 4.0,
    default: null
  },
  phoneNumber: {
    type: String,
    match: [/^[\+]?[0-9][\d]{0,15}$/, 'Please enter a valid phone number'],
    default: null
  },
  rollNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness
    trim: true,
    default: null
  },
  attendance: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  backlogs: {
    type: Number,
    min: 0,
    default: 0
  },
  codeOfConduct: {
    type: Boolean,
    default: false
  },
  
  // Eligibility status
  isEligible: {
    type: Boolean,
    default: false
  },
  eligibilityDetails: {
    cgpa: {
      met: { type: Boolean, default: false },
      value: { type: Number, default: null }
    },
    semester: {
      met: { type: Boolean, default: false },
      value: { type: String, default: null }
    },
    backlogs: {
      met: { type: Boolean, default: false },
      value: { type: Number, default: null }
    },
    attendance: {
      met: { type: Boolean, default: false },
      value: { type: Number, default: null }
    },
    codeOfConduct: {
      met: { type: Boolean, default: false },
      acknowledged: { type: Boolean, default: false }
    }
  },
  lastEligibilityCheck: {
    type: Date,
    default: null
  },
  
  // File uploads
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
  }],

  // Profile completion status
  profileCompleted: {
    type: Boolean,
    default: false
  },

  // Activity tracking
  lastProfileUpdate: {
    type: Date,
    default: Date.now
  },

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },

  // Selected supervisor for internship applications
  selectedSupervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // CV Builder data
  cvData: {
    personalInfo: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      objective: { type: String, default: '' }
    },
    education: [{
      degree: { type: String, default: '' },
      institution: { type: String, default: '' },
      year: { type: String, default: '' },
      cgpa: { type: String, default: '' },
      description: { type: String, default: '' }
    }],
    experience: [{
      position: { type: String, default: '' },
      company: { type: String, default: '' },
      duration: { type: String, default: '' },
      description: { type: String, default: '' }
    }],
    skills: {
      technical: [{ type: String }],
      soft: [{ type: String }],
      languages: [{ type: String }]
    },
    projects: [{
      title: { type: String, default: '' },
      technologies: { type: String, default: '' },
      duration: { type: String, default: '' },
      description: { type: String, default: '' }
    }],
    certifications: [{
      name: { type: String, default: '' },
      issuer: { type: String, default: '' },
      date: { type: String, default: '' },
      url: { type: String, default: '' }
    }],
    achievements: [{ type: String }]
  },
  cvLastUpdated: {
    type: Date,
    default: null
  },

  // Role (fixed as student)
  role: {
    type: String,
    default: 'student',
    immutable: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profile completion percentage
studentSchema.virtual('profileCompletionPercentage').get(function() {
  let completed = 0;
  const totalFields = 8; // profilePicture, cgpa, phoneNumber, rollNumber, attendance, backlogs, cv, certificates
  
  if (this.profilePicture) completed++;
  if (this.cgpa !== null && this.cgpa !== undefined) completed++;
  if (this.phoneNumber) completed++;
  if (this.rollNumber) completed++;
  if (this.attendance !== null && this.attendance !== undefined) completed++;
  if (this.backlogs !== null && this.backlogs !== undefined) completed++;
  if (this.cv && this.cv.filename) completed++;
  if (this.certificates && this.certificates.length > 0) completed++;
  
  return Math.round((completed / totalFields) * 100);
});

// Index for better query performance
studentSchema.index({ email: 1 });
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ department: 1, semester: 1 });

// Pre-save middleware to update profile completion status
studentSchema.pre('save', function(next) {
  this.profileCompleted = this.profileCompletionPercentage >= 80;
  this.lastProfileUpdate = new Date();
  next();
});

// Instance method to get safe profile data (without password)
studentSchema.methods.toSafeObject = function() {
  const studentObject = this.toObject();
  delete studentObject.password;
  return studentObject;
};

// Static method to find students by department
studentSchema.statics.findByDepartment = function(department) {
  return this.find({ department: department, isActive: true });
};

// Static method to find students by semester
studentSchema.statics.findBySemester = function(semester) {
  return this.find({ semester: semester, isActive: true });
};

// Static method to check student eligibility
studentSchema.statics.checkEligibility = function(studentData) {
  const requirements = {
    cgpa: { met: false, value: studentData.cgpa },
    semester: { met: false, value: studentData.semester },
    backlogs: { met: false, value: studentData.backlogs },
    attendance: { met: false, value: studentData.attendance },
    codeOfConduct: { met: false, value: studentData.codeOfConduct || false }
  };

  let isEligible = true;
  const unmetRequirements = [];

  // Check CGPA ≥ 2.5
  if (studentData.cgpa !== null && studentData.cgpa !== undefined) {
    requirements.cgpa.met = studentData.cgpa >= 2.5;
    if (!requirements.cgpa.met) {
      isEligible = false;
      unmetRequirements.push('CGPA must be 2.5 or higher');
    }
  } else {
    isEligible = false;
    unmetRequirements.push('CGPA is required');
  }

  // Check Semester ≥ 5 (fixed from 7 to 5)
  if (studentData.semester) {
    const semesterNumber = parseInt(studentData.semester.replace('th', '').replace('st', '').replace('nd', '').replace('rd', ''));
    requirements.semester.met = semesterNumber >= 5;
    if (!requirements.semester.met) {
      isEligible = false;
      unmetRequirements.push('Must be in semester 5 or higher');
    }
  } else {
    isEligible = false;
    unmetRequirements.push('Semester is required');
  }

  // Check Backlogs = 0
  if (studentData.backlogs !== null && studentData.backlogs !== undefined) {
    requirements.backlogs.met = studentData.backlogs === 0;
    if (!requirements.backlogs.met) {
      isEligible = false;
      unmetRequirements.push('Must have no active backlogs');
    }
  } else {
    isEligible = false;
    unmetRequirements.push('Backlogs information is required');
  }

  // Check Attendance ≥ 75%
  if (studentData.attendance !== null && studentData.attendance !== undefined) {
    requirements.attendance.met = studentData.attendance >= 75;
    if (!requirements.attendance.met) {
      isEligible = false;
      unmetRequirements.push('Attendance must be 75% or higher');
    }
  } else {
    isEligible = false;
    unmetRequirements.push('Attendance is required');
  }

  // Check Code of Conduct acknowledgment
  requirements.codeOfConduct.met = studentData.codeOfConduct === true;
  if (!requirements.codeOfConduct.met) {
    isEligible = false;
    unmetRequirements.push('Must acknowledge Code of Conduct');
  }

  return {
    eligible: isEligible,
    requirements: requirements,
    unmetRequirements: unmetRequirements
  };
};

// Static method to find students by semester
studentSchema.statics.findBySemester = function(semester) {
  return this.find({ semester: semester, isActive: true });
};

module.exports = mongoose.model('Student', studentSchema);
