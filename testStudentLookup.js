// Test supervision request creation
const mongoose = require('mongoose');
const Student = require('./models/Student');
const SupervisionRequest = require('./models/SupervisionRequest');

async function testStudentLookup() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    
    console.log('Connected to MongoDB');
    
    // Look up the student by email
    const email = 'abdjaved634@gmail.com';
    const student = await Student.findOne({ email: email });
    
    if (student) {
      console.log('✅ Student found:');
      console.log(`ID: ${student._id}`);
      console.log(`Name: ${student.fullName}`);
      console.log(`Email: ${student.email}`);
      console.log(`Roll Number: ${student.rollNumber}`);
      console.log(`Department: ${student.department}`);
      console.log(`Semester: ${student.semester}`);
      console.log(`CGPA: ${student.cgpa}`);
      console.log(`Phone: ${student.phoneNumber}`);
      
      // Test creating a supervision request
      const testRequest = {
        studentId: student._id,
        studentName: student.fullName,
        studentEmail: student.email,
        studentRollNumber: student.rollNumber || 'N/A',
        studentDepartment: student.department || 'N/A',
        studentSemester: student.semester || 'N/A',
        studentCGPA: student.cgpa ? student.cgpa.toString() : 'N/A',
        studentPhoneNumber: student.phoneNumber || 'N/A',
      };
      
      console.log('\n📋 Test supervision request data:');
      console.log(JSON.stringify(testRequest, null, 2));
      
    } else {
      console.log('❌ Student not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testStudentLookup();
