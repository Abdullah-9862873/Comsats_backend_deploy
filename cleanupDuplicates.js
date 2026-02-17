const Student = require('./models/Student');
const connectDB = require('./config/db');
require('dotenv').config();

const cleanupDuplicates = async () => {
  try {
    await connectDB();

    // Find all students with the email
    const students = await Student.find({ email: "student123@gmail.com" });
    console.log(`Found ${students.length} student records:`);
    
    students.forEach((student, index) => {
      console.log(`\n--- Student ${index + 1} ---`);
      console.log(`ID: ${student._id}`);
      console.log(`Name: ${student.fullName}`);
      console.log(`CGPA: ${student.cgpa}`);
      console.log(`Phone: ${student.phoneNumber}`);
      console.log(`Created: ${student.createdAt}`);
    });

    // Delete the old record that doesn't have updated data
    const oldRecord = students.find(s => s.cgpa === null);
    const newRecord = students.find(s => s.cgpa !== null);

    if (oldRecord && newRecord) {
      console.log(`\nDeleting old record: ${oldRecord._id}`);
      await Student.findByIdAndDelete(oldRecord._id);
      console.log('Old record deleted successfully');
      
      console.log(`\nKeeping updated record: ${newRecord._id}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

cleanupDuplicates();
