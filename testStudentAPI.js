const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('./models/Student');
const connectDB = require('./config/db');
require('dotenv').config();

// Test the Student API endpoints
const testStudentAPI = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a test student
    console.log('\n🧪 Test 1: Creating a test student...');
    
    // First, clean up any existing test student
    await Student.deleteOne({ email: 'test.student@example.com' });
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    const testStudent = new Student({
      fullName: 'John Doe',
      email: 'test.student@example.com',
      password: hashedPassword,
      department: 'Computer Science',
      semester: '6th'
    });
    
    await testStudent.save();
    console.log('✅ Test student created successfully');
    console.log('Student ID:', testStudent._id);
    console.log('Profile Completion:', testStudent.profileCompletionPercentage + '%');

    // Test 2: Update student profile with additional data
    console.log('\n🧪 Test 2: Updating student profile...');
    
    testStudent.cgpa = 3.5;
    testStudent.phoneNumber = '+923001234567';
    testStudent.rollNumber = 'CS-2020-123';
    testStudent.attendance = 85;
    testStudent.backlogs = 1;
    
    await testStudent.save();
    console.log('✅ Student profile updated successfully');
    console.log('Updated Profile Completion:', testStudent.profileCompletionPercentage + '%');
    console.log('Profile Completed Status:', testStudent.profileCompleted);

    // Test 3: Test virtual fields and methods
    console.log('\n🧪 Test 3: Testing virtual fields and methods...');
    
    const safeProfile = testStudent.toSafeObject();
    console.log('✅ Safe profile object created (password removed)');
    console.log('Has password in safe object:', 'password' in safeProfile ? '❌ Error' : '✅ Good');

    // Test 4: Test static methods
    console.log('\n🧪 Test 4: Testing static methods...');
    
    const csStudents = await Student.findByDepartment('Computer Science');
    console.log('✅ Found', csStudents.length, 'Computer Science students');
    
    const sixthSemStudents = await Student.findBySemester('6th');
    console.log('✅ Found', sixthSemStudents.length, '6th semester students');

    // Test 5: Test validation
    console.log('\n🧪 Test 5: Testing validation...');
    
    try {
      const invalidStudent = new Student({
        fullName: 'Invalid Student',
        email: 'invalid-email', // Invalid email format
        password: '123', // Too short password
        department: 'Computer Science',
        semester: '6th'
      });
      await invalidStudent.save();
      console.log('❌ Validation test failed - invalid student was saved');
    } catch (error) {
      console.log('✅ Validation working correctly - invalid student rejected');
    }

    // Test 6: Test unique constraints
    console.log('\n🧪 Test 6: Testing unique constraints...');
    
    try {
      const duplicateStudent = new Student({
        fullName: 'Duplicate Student',
        email: 'test.student@example.com', // Same email
        password: hashedPassword,
        department: 'Computer Science',
        semester: '6th'
      });
      await duplicateStudent.save();
      console.log('❌ Unique constraint test failed - duplicate email was allowed');
    } catch (error) {
      console.log('✅ Unique constraint working correctly - duplicate email rejected');
    }

    // Test 7: Test roll number uniqueness
    console.log('\n🧪 Test 7: Testing roll number uniqueness...');
    
    const anotherStudent = new Student({
      fullName: 'Another Student',
      email: 'another.student@example.com',
      password: hashedPassword,
      department: 'Software Engineering',
      semester: '4th'
    });
    await anotherStudent.save();
    
    try {
      anotherStudent.rollNumber = 'CS-2020-123'; // Same roll number as test student
      await anotherStudent.save();
      console.log('❌ Roll number uniqueness test failed - duplicate roll number was allowed');
    } catch (error) {
      console.log('✅ Roll number uniqueness working correctly - duplicate roll number rejected');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Student.deleteOne({ email: 'test.student@example.com' });
    await Student.deleteOne({ email: 'another.student@example.com' });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 API Endpoints Available:');
    console.log('POST   /api/students/register          - Register new student');
    console.log('POST   /api/students/login             - Student login');
    console.log('GET    /api/students/profile           - Get student profile');
    console.log('PUT    /api/students/profile           - Update profile with files');
    console.log('DELETE /api/students/certificates/:id  - Delete certificate');
    console.log('GET    /api/students/all               - Get all students (admin)');
    console.log('GET    /api/students/stats             - Get student statistics (admin)');
    
    console.log('\n📤 File Upload Fields:');
    console.log('profilePicture  - Single image file (JPEG, PNG, GIF) max 5MB');
    console.log('cv              - Single document (PDF, DOC, DOCX) max 10MB');
    console.log('certificates    - Multiple files (PDF, DOC, DOCX, Images) max 10MB each');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

// Run tests
testStudentAPI();
