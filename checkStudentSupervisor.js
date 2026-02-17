const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const Student = require('./models/Student');

const checkStudentSupervisor = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find the student user with email student_2@gmail.com
    const studentUser = await User.findOne({ email: 'student_2@gmail.com' });
    console.log('✅ Found student user:', studentUser?.name);

    // Find the student profile
    const student = await Student.findOne({ email: 'student_2@gmail.com' });
    
    if (student) {
      console.log('✅ Found student profile:', student.fullName);
      console.log('   Has supervisor?', student.selectedSupervisorId ? 'YES' : 'NO');
      
      if (student.selectedSupervisorId) {
        const supervisor = await User.findById(student.selectedSupervisorId);
        console.log('   Supervisor:', supervisor?.name);
      } else {
        console.log('❌ Student does not have a supervisor assigned');
        
        // Let's assign a supervisor
        const supervisor = await User.findOne({ role: 'supervisor' });
        if (supervisor) {
          student.selectedSupervisorId = supervisor._id;
          await student.save();
          console.log('✅ Assigned supervisor:', supervisor.name);
        }
      }
    } else {
      console.log('❌ Student profile not found in Student collection');
      
      // Create student profile
      if (studentUser) {
        const supervisor = await User.findOne({ role: 'supervisor' });
        const newStudent = new Student({
          fullName: studentUser.name,
          email: studentUser.email,
          password: 'temp123',
          department: 'Computer Science',
          semester: '8th',
          selectedSupervisorId: supervisor?._id
        });
        
        await newStudent.save();
        console.log('✅ Created student profile with supervisor:', supervisor?.name);
      }
    }

    console.log('\n✅ Student supervisor check completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

checkStudentSupervisor();
