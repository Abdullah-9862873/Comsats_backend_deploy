require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User');

async function checkCertificates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('=== CHECKING CERTIFICATES ===');
    
    // Check Student model for certificates
    const studentsWithCerts = await Student.find({ 'certificates.0': { $exists: true } });
    console.log('Students with certificates in Student model:', studentsWithCerts.length);
    
    if (studentsWithCerts.length > 0) {
      studentsWithCerts.forEach(student => {
        console.log(`Student: ${student.fullName || student.email}, Certificates: ${student.certificates.length}`);
        student.certificates.forEach((cert, idx) => {
          console.log(`  ${idx + 1}. ID: ${cert._id}, Name: ${cert.originalName}`);
        });
      });
    }
    
    // Check User model for students
    const userStudents = await User.find({ role: 'student' });
    console.log('\nStudents in User model:', userStudents.length);
    
    if (userStudents.length > 0) {
      userStudents.forEach(user => {
        console.log(`User Student: ${user.name} (${user.email}), ID: ${user._id}`);
      });
    }
    
    // Check all students in Student model
    const allStudents = await Student.find({});
    console.log('\nAll students in Student model:', allStudents.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCertificates();
