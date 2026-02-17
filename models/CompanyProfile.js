const mongoose = require('mongoose');

// Sub-schemas for structured data
const socialMediaSchema = new mongoose.Schema({
  linkedin: { type: String, trim: true },
  twitter: { type: String, trim: true },
  facebook: { type: String, trim: true },
  instagram: { type: String, trim: true },
  youtube: { type: String, trim: true },
  website: { type: String, trim: true }
}, { _id: false });

const contactPersonSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  designation: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true }  // Made optional
}, { _id: false });

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  path: { type: String, required: true },
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const certificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  issuedBy: { type: String, required: true, trim: true },
  issuedDate: { type: Date },
  description: { type: String, trim: true },
  addedAt: { type: Date, default: Date.now }
});

const companyProfileSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  
  // Basic Information
  companyName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  industry: { 
    type: String, 
    trim: true 
  },
  website: { 
    type: String, 
    trim: true 
  },
  about: { 
    type: String, 
    trim: true 
  },
  
  // Contact Information
  companyEmail: { 
    type: String, 
    trim: true, 
    lowercase: true 
  },
  companyPhone: { 
    type: String, 
    trim: true  // Made optional to avoid validation errors
  },
  address: { 
    type: String, 
    trim: true 
  },
  
  // Company Details
  foundedYear: { 
    type: Number, 
    min: 1800, 
    max: new Date().getFullYear() 
  },
  employeeCount: { 
    type: String, 
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    trim: true 
  },
  headquartersLocation: { 
    type: String, 
    trim: true 
  },
  
  // Media
  profilePicture: {
    path: String,
    filename: String,
    originalname: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  bannerImage: {
    path: String,
    filename: String,
    originalname: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  
  // Social Media
  socialMedia: socialMediaSchema,
  
  // Vision & Mission
  vision: { 
    type: String, 
    trim: true 
  },
  mission: { 
    type: String, 
    trim: true 
  },
  
  // Specialties
  specialties: [{ 
    type: String, 
    trim: true 
  }],
  
  // Contact Person
  contactPerson: contactPersonSchema,
  
  // Documents & Certifications
  documents: [documentSchema],
  certifications: [certificationSchema],
  
  // Meta Information
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Middleware to update lastUpdated field
companyProfileSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Virtual for profile completeness
companyProfileSchema.virtual('profileCompleteness').get(function() {
  const fields = [
    'companyName', 'industry', 'about', 'companyEmail', 
    'website', 'foundedYear', 'employeeCount', 'headquartersLocation',
    'vision', 'mission', 'contactPerson.name', 'contactPerson.email'
  ];
  
  let filledFields = 0;
  fields.forEach(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (this[parent] && this[parent][child]) filledFields++;
    } else {
      if (this[field]) filledFields++;
    }
  });
  
  // Bonus points for media and social links
  if (this.profilePicture && this.profilePicture.path) filledFields += 0.5;
  if (this.bannerImage && this.bannerImage.path) filledFields += 0.5;
  if (this.socialMedia && this.socialMedia.linkedin) filledFields += 0.5;
  if (this.specialties && this.specialties.length > 0) filledFields += 0.5;
  
  return Math.round((filledFields / (fields.length + 2)) * 100);
});

// Ensure virtual fields are serialized
companyProfileSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);