const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Get company profile
const getCompanyProfile = async (req, res) => {
  try {
    console.log('📋 Getting company profile for user:', req.user.id);

    let profile = await CompanyProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      console.log('🔧 No profile found, creating from user data...');
      // Create profile from user data
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      profile = new CompanyProfile({
        user: req.user.id,
        companyName: user.company?.companyName || user.name || 'Unnamed Company',
        companyEmail: user.email,
        industry: user.company?.industry || '',
        website: user.company?.website || '',
        about: user.company?.about || ''
      });
      
      await profile.save();
      console.log('✅ Created new profile for company:', profile.companyName);
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('❌ Error getting company profile:', error);
    res.status(500).json({ 
      message: 'Error fetching company profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update company profile
const updateCompanyProfile = async (req, res) => {
  try {
    console.log('📝 Updating company profile for user:', req.user.id);
    console.log('📝 Update data:', req.body);

    const allowedFields = [
      'industry', 'website', 'about', 'companyEmail', 'companyPhone', 
      'address', 'foundedYear', 'employeeCount', 'headquartersLocation',
      'vision', 'mission', 'specialties', 'socialMedia', 'contactPerson'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    console.log('🔍 Filtered update data:', updateData);

    const profile = await CompanyProfile.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    res.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating company profile:', error);
    res.status(400).json({ 
      message: 'Error updating company profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Validation failed'
    });
  }
};

// Upload profile image (logo or banner)
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageType = req.route.path.includes('logo') ? 'profilePicture' : 'bannerImage';
    console.log(`📸 Uploading ${imageType} for user:`, req.user.id);

    const profile = await CompanyProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    // Delete old image if exists
    if (profile[imageType] && profile[imageType].path) {
      const oldImagePath = path.join(__dirname, '..', profile[imageType].path);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('🗑️ Deleted old image:', oldImagePath);
      }
    }

    // Update profile with new image
    profile[imageType] = {
      path: req.file.path,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date()
    };

    await profile.save();

    res.json({
      success: true,
      data: profile,
      message: `${imageType === 'profilePicture' ? 'Logo' : 'Banner'} uploaded successfully`
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({ 
      message: 'Error uploading image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Upload failed'
    });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Document name is required' });
    }

    console.log('📄 Uploading document for user:', req.user.id);

    const profile = await CompanyProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    const newDocument = {
      name,
      path: req.file.path,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date()
    };

    profile.documents.push(newDocument);
    await profile.save();

    res.json({
      success: true,
      data: profile,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    res.status(500).json({ 
      message: 'Error uploading document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Upload failed'
    });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log('🗑️ Deleting document for user:', req.user.id);

    const profile = await CompanyProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    const documentIndex = profile.documents.findIndex(doc => doc._id.toString() === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = profile.documents[documentIndex];
    
    // Delete file from filesystem
    if (document.path) {
      const filePath = path.join(__dirname, '..', document.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Deleted file:', filePath);
      }
    }

    // Remove from profile
    profile.documents.splice(documentIndex, 1);
    await profile.save();

    res.json({
      success: true,
      data: profile,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({ 
      message: 'Error deleting document',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Delete failed'
    });
  }
};

// Add certification
const addCertification = async (req, res) => {
  try {
    const { title, issuedBy, issuedDate, description } = req.body;
    console.log('🏆 Adding certification for user:', req.user.id);

    if (!title || !issuedBy) {
      return res.status(400).json({ message: 'Title and issuer are required' });
    }

    const profile = await CompanyProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    const newCertification = {
      title,
      issuedBy,
      issuedDate: issuedDate ? new Date(issuedDate) : undefined,
      description
    };

    profile.certifications.push(newCertification);
    await profile.save();

    res.json({
      success: true,
      data: profile,
      message: 'Certification added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding certification:', error);
    res.status(500).json({ 
      message: 'Error adding certification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Add failed'
    });
  }
};

// Delete certification
const deleteCertification = async (req, res) => {
  try {
    const { certificationId } = req.params;
    console.log('🗑️ Deleting certification for user:', req.user.id);

    const profile = await CompanyProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    const certificationIndex = profile.certifications.findIndex(cert => cert._id.toString() === certificationId);
    if (certificationIndex === -1) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    profile.certifications.splice(certificationIndex, 1);
    await profile.save();

    res.json({
      success: true,
      data: profile,
      message: 'Certification deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting certification:', error);
    res.status(500).json({ 
      message: 'Error deleting certification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Delete failed'
    });
  }
};

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  uploadProfileImage,
  uploadDocument,
  deleteDocument,
  addCertification,
  deleteCertification
};