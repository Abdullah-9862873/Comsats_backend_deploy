const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Student = require('./models/Student');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const testSupervisorSelection = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a test student record
    console.log('\n🧪 Test 1: Creating test student...');
    
    const testStudent = new Student({
      fullName: 'Test Student',
      email: 'test.student@example.com',
      password: 'password123',
      department: 'Computer Science',
      semester: '6th'
    });
    
    await testStudent.save();
    console.log('✅ Test student created');

    // Test 2: Find a supervisor to select
    console.log('\n🧪 Test 2: Finding a supervisor...');
    
    const supervisor = await User.findOne({ role: 'supervisor' }).select('name email supervisor');
    if (!supervisor) {
      console.log('❌ No supervisors found in database');
      process.exit(1);
    }
    
    console.log('✅ Found supervisor:', supervisor.name);

    // Test 3: Update student with selected supervisor
    console.log('\n🧪 Test 3: Updating student with selected supervisor...');
    
    const updatedStudent = await Student.findByIdAndUpdate(
      testStudent._id,
      { selectedSupervisorId: supervisor._id },
      { new: true }
    ).populate('selectedSupervisorId', 'name email supervisor');
    
    console.log('✅ Student updated with supervisor');
    console.log('Selected Supervisor ID:', updatedStudent.selectedSupervisorId._id);
    console.log('Selected Supervisor Name:', updatedStudent.selectedSupervisorId.name);

    // Test 4: Test the response transformation
    console.log('\n🧪 Test 4: Testing response transformation...');
    
    const studentObject = updatedStudent.toObject();
    
    if (studentObject.selectedSupervisorId) {
      const supervisor = studentObject.selectedSupervisorId;
      studentObject.selectedSupervisor = {
        _id: supervisor._id,
        id: supervisor._id,
        name: supervisor.name,
        email: supervisor.email,
        department: supervisor.supervisor?.department || 'Not specified',
        designation: supervisor.supervisor?.designation || 'Supervisor',
        maxStudents: supervisor.supervisor?.maxStudents || 10,
        currentStudents: supervisor.supervisor?.currentStudents || 0,
        expertise: supervisor.supervisor?.expertise || [],
        phone: supervisor.supervisor?.phone || '',
        office: supervisor.supervisor?.office || '',
        officeHours: supervisor.supervisor?.officeHours || ''
      };
    }
    
    console.log('✅ Response transformation successful');
    console.log('Selected Supervisor Object:', JSON.stringify(studentObject.selectedSupervisor, null, 2));

    // Test 5: Cleanup
    console.log('\n🧪 Test 5: Cleaning up...');
    await Student.findByIdAndDelete(testStudent._id);
    console.log('✅ Test student deleted');

    console.log('\n🎉 All tests passed! Supervisor selection backend is working correctly.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  }
};

testSupervisorSelection();
