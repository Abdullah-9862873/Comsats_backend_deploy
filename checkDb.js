const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    
    const Student = require('./models/Student');
    
    // Find students with the specific file that's failing
    const students = await Student.find({
      $or: [
        { 'cv.filename': { $regex: 'cv_68a8d447729e47a2635a6fc4' } },
        { 'certificates.filename': { $regex: 'cert_68a8d447729e47a2635a6fc4' } }
      ]
    });
    
    console.log(`Found ${students.length} students with files containing '68a8d447729e47a2635a6fc4'`);
    
    students.forEach(student => {
      console.log(`\nStudent: ${student.fullName} (${student.email})`);
      if (student.cv && student.cv.filename) {
        console.log(`CV: ${student.cv.filename} -> ${student.cv.path}`);
      }
      student.certificates.forEach((cert, index) => {
        console.log(`Cert ${index}: ${cert.filename} -> ${cert.path}`);
      });
    });
    
    // Also get recent students
    const recentStudents = await Student.find().sort({ updatedAt: -1 }).limit(3);
    console.log('\nMost recent 3 students:');
    recentStudents.forEach(student => {
      console.log(`\n${student.fullName} (${student.email}) - Updated: ${student.updatedAt}`);
      if (student.cv && student.cv.filename) {
        console.log(`  CV: ${student.cv.filename}`);
      }
      if (student.certificates.length > 0) {
        student.certificates.forEach((cert, index) => {
          console.log(`  Cert ${index}: ${cert.filename}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabase();
