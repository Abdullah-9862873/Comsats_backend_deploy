const Student = require('../models/Student');

// Get CV data for a student
const getCVData = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const student = await Student.findById(studentId).select('cvData');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      data: student.cvData || null
    });
  } catch (error) {
    console.error('Error getting CV data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching CV data'
    });
  }
};

// Save CV data for a student
const saveCVData = async (req, res) => {
  try {
    const studentId = req.user.id;
    const cvData = req.body;
    
    console.log('💾 CV SAVE DEBUG:');
    console.log('   Student ID from token:', studentId);
    console.log('   CV Data received:', Object.keys(cvData));
    
    // Validate required fields
    if (!cvData.personalInfo || !cvData.personalInfo.fullName) {
      console.log('❌ Missing required personal info');
      return res.status(400).json({
        success: false,
        message: 'Personal information with full name is required'
      });
    }
    
    // Find student or create if not exists (for new users)
    let student = await Student.findById(studentId);
    console.log('🔍 Student lookup result:', student ? 'FOUND' : 'NOT FOUND');
    
    if (!student) {
      console.log('🆕 Creating new student record...');
      // If student doesn't exist, this might be a new user
      // Get user info from token to create basic student profile
      const User = require('../models/User');
      const user = await User.findById(studentId);
      console.log('👤 User lookup result:', user ? `FOUND (${user.name})` : 'NOT FOUND');
      
      if (!user || user.role !== 'student') {
        console.log('❌ User not found or not a student');
        return res.status(404).json({
          success: false,
          message: 'Student account not found'
        });
      }
      
      // Create basic student profile
      student = new Student({
        _id: studentId,
        fullName: user.name,
        email: user.email,
        department: user.department || 'Computer Science',
        semester: user.semester || '7th',
        password: 'temppass123', // Temporary password that meets minimum length requirement
        cvData: cvData,
        cvLastUpdated: new Date()
      });
      console.log('✅ New student record created');
    } else {
      console.log('📝 Updating existing student CV data');
      // Update existing student's CV data
      student.cvData = cvData;
      student.cvLastUpdated = new Date();
    }
    
    await student.save();
    console.log('💾 Student record saved successfully');
    
    res.json({
      success: true,
      message: 'CV data saved successfully',
      data: student.cvData
    });
  } catch (error) {
    console.error('❌ Error saving CV data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving CV data'
    });
  }
};

module.exports = {
  getCVData,
  saveCVData
};