const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Student = require('./models/Student');
const connectDB = require('./config/db');
require('dotenv').config();

const testToken = async () => {
  try {
    await connectDB();

    // Test the token from frontend
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OGQxOWMzMGQ3N2M3ZGI0MTc5ODFjNSIsImlhdCI6MTczNzE5NjQ5OSwiZXhwIjoxNzM3ODAxMjk5fQ.ZnPJr1mGKNV5jFRg-LFjw96NwLXJk0rZxzwrMlrIDZ8';
    
    console.log('\n--- Token Verification Test ---');
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
      
      // Check if user exists in User model
      const user = await User.findById(decoded.id);
      console.log('User found:', user ? `${user.name} (${user.email})` : 'Not found');
      
      // Check if user exists in Student model
      const student = await Student.findById(decoded.id);
      console.log('Student found:', student ? `${student.fullName} (${student.email})` : 'Not found');
      
    } catch (error) {
      console.log('Token verification failed:', error.message);
    }

    // List all users
    console.log('\n--- All Users ---');
    const users = await User.find().select('name email role');
    users.forEach(user => {
      console.log(`ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });

    // List all students
    console.log('\n--- All Students ---');
    const students = await Student.find().select('fullName email');
    students.forEach(student => {
      console.log(`ID: ${student._id}, Name: ${student.fullName}, Email: ${student.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

testToken();
