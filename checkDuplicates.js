const Student = require('./models/Student');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const checkDuplicates = async () => {
  try {
    await connectDB();

    // Find all students with the email
    const students = await Student.find({ email: "student123@gmail.com" });
    console.log(`Found ${students.length} student records:`);
    
    students.forEach((student, index) => {
      console.log(`\n--- Student ${index + 1} ---`);
      console.log(`ID: ${student._id}`);
      console.log(`Name: ${student.fullName}`);
      console.log(`Email: ${student.email}`);
      console.log(`CGPA: ${student.cgpa}`);
      console.log(`Phone: ${student.phoneNumber}`);
      console.log(`Attendance: ${student.attendance}`);
      console.log(`Backlogs: ${student.backlogs}`);
      console.log(`Created: ${student.createdAt}`);
      console.log(`Updated: ${student.updatedAt}`);
    });

    // Also check User model
    const user = await User.findOne({ email: "student123@gmail.com" });
    console.log('\n--- User Record ---');
    if (user) {
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
    } else {
      console.log('No user found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDuplicates();
