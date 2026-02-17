require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User');
const ProgressReport = require('./models/ProgressReport');

async function checkStudentRollNumber() {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('❌ MONGO_URI not found in environment variables');
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find the progress report for "Student Abdullah"
    console.log('=== CHECKING PROGRESS REPORT ===');
    const progressReport = await ProgressReport.findOne({ studentName: 'Student Abdullah' });
    
    if (!progressReport) {
      console.log('❌ No progress report found for Student Abdullah');
      await mongoose.disconnect();
      return;
    }
    
    console.log('📄 Progress Report Found:');
    console.log('  Student Name:', progressReport.studentName);
    console.log('  Stored Roll Number:', progressReport.rollNumber);
    console.log('  Student ID:', progressReport.studentId);
    console.log('  Report ID:', progressReport._id);
    
    // Look up the student user
    console.log('\n=== CHECKING USER ===');
    const studentUser = await User.findById(progressReport.studentId);
    
    if (!studentUser) {
      console.log('❌ No user found with ID:', progressReport.studentId);
      await mongoose.disconnect();
      return;
    }
    
    console.log('👤 User Found:');
    console.log('  Name:', studentUser.name);
    console.log('  Email:', studentUser.email);
    console.log('  Role:', studentUser.role);
    
    // Look up the student profile
    console.log('\n=== CHECKING STUDENT PROFILE ===');
    const studentProfile = await Student.findOne({ email: studentUser.email });
    
    if (!studentProfile) {
      console.log('❌ No student profile found for email:', studentUser.email);
      await mongoose.disconnect();
      return;
    }
    
    console.log('🎓 Student Profile Found:');
    console.log('  Full Name:', studentProfile.fullName);
    console.log('  Email:', studentProfile.email);
    console.log('  Roll Number:', studentProfile.rollNumber);
    console.log('  Department:', studentProfile.department);
    console.log('  Semester:', studentProfile.semester);
    
    // Summary
    console.log('\n=== SUMMARY ===');
    if (studentProfile.rollNumber) {
      console.log('✅ Student HAS a roll number in database:', studentProfile.rollNumber);
      console.log('   But progress report shows:', progressReport.rollNumber);
      if (progressReport.rollNumber !== studentProfile.rollNumber) {
        console.log('   ⚠️  MISMATCH! Need to update the report.');
      }
    } else {
      console.log('❌ Student does NOT have a roll number in database');
      console.log('   Student needs to update their profile with roll number');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStudentRollNumber();
