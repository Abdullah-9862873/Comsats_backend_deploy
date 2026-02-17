const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

async function createTestStudent() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal');
    console.log('Connected to MongoDB');

    // Check if test student already exists
    const existingStudent = await User.findOne({ 
      email: 'student.test@example.com',
      role: 'student'
    });

    if (existingStudent) {
      console.log('Test student already exists!');
      console.log('Email: student.test@example.com');
      console.log('Password: password123');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test student
    const testStudent = new User({
      name: 'Test Student',
      email: 'student.test@example.com',
      password: hashedPassword,
      role: 'student',
      isVerified: true
    });

    await testStudent.save();
    console.log('Test student created successfully!');
    console.log('Email: student.test@example.com');
    console.log('Password: password123');
    console.log('Role: student');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test student:', error);
    process.exit(1);
  }
}

createTestStudent();
