require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');

const debugSupervisorPopulation = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the student with supervisor issues
    const student = await Student.findOne({ 
      selectedSupervisorId: { $ne: null } 
    });

    if (!student) {
      console.log('No student found with selectedSupervisorId');
      return;
    }

    console.log('Student found:', student.fullName);
    console.log('Student selectedSupervisorId:', student.selectedSupervisorId);

    // Check if the supervisor exists in User collection
    const supervisorExists = await User.findById(student.selectedSupervisorId);
    
    if (supervisorExists) {
      console.log('\n✅ Supervisor exists in User collection:');
      console.log('  Name:', supervisorExists.name);
      console.log('  Email:', supervisorExists.email);
      console.log('  Role:', supervisorExists.role);
      console.log('  Has supervisor profile:', !!supervisorExists.supervisor);
      
      if (supervisorExists.supervisor) {
        console.log('  Department:', supervisorExists.supervisor.department);
        console.log('  Designation:', supervisorExists.supervisor.designation);
        console.log('  Phone:', supervisorExists.supervisor.phone);
      }
    } else {
      console.log('❌ Supervisor NOT found in User collection');
      console.log('This explains why population is failing!');
    }

    // Test population without field selection
    console.log('\n=== Testing Population ===');
    const populatedStudent = await Student.findById(student._id).populate('selectedSupervisorId');
    
    if (populatedStudent.selectedSupervisorId) {
      console.log('✅ Population successful:');
      console.log('  Populated supervisor name:', populatedStudent.selectedSupervisorId.name);
      console.log('  Populated supervisor email:', populatedStudent.selectedSupervisorId.email);
      console.log('  Has supervisor profile:', !!populatedStudent.selectedSupervisorId.supervisor);
    } else {
      console.log('❌ Population failed');
    }

    // Test with specific field selection
    const populatedWithFields = await Student.findById(student._id).populate('selectedSupervisorId', 'name email supervisor');
    
    if (populatedWithFields.selectedSupervisorId) {
      console.log('\n✅ Population with field selection successful:');
      console.log('  Name:', populatedWithFields.selectedSupervisorId.name);
      console.log('  Email:', populatedWithFields.selectedSupervisorId.email);
      console.log('  Supervisor profile:', populatedWithFields.selectedSupervisorId.supervisor);
    } else {
      console.log('\n❌ Population with field selection failed');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

debugSupervisorPopulation();