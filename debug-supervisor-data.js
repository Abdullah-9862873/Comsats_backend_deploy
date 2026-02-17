require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User');

const checkSupervisorData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a student with a selected supervisor
    const student = await Student.findOne({ 
      selectedSupervisorId: { $ne: null } 
    }).populate('selectedSupervisorId');

    if (!student) {
      console.log('No student found with selected supervisor');
      return;
    }

    console.log('Student found:', student.fullName);
    console.log('Student email:', student.email);
    
    if (student.selectedSupervisorId) {
      console.log('\n=== SUPERVISOR DATA STRUCTURE ===');
      console.log('Supervisor ID:', student.selectedSupervisorId._id);
      console.log('Supervisor Name:', student.selectedSupervisorId.name);
      console.log('Supervisor Email:', student.selectedSupervisorId.email);
      console.log('Supervisor Role:', student.selectedSupervisorId.role);
      
      console.log('\n=== SUPERVISOR PROFILE DATA ===');
      console.log('Full supervisor object:', JSON.stringify(student.selectedSupervisorId.supervisor, null, 2));
      
      if (student.selectedSupervisorId.supervisor) {
        console.log('Department:', student.selectedSupervisorId.supervisor.department || 'Not set');
        console.log('Designation:', student.selectedSupervisorId.supervisor.designation || 'Not set');
        console.log('Phone:', student.selectedSupervisorId.supervisor.phone || 'Not set');
        console.log('Office:', student.selectedSupervisorId.supervisor.office || 'Not set');
        console.log('Office Hours:', student.selectedSupervisorId.supervisor.officeHours || 'Not set');
        console.log('Expertise:', student.selectedSupervisorId.supervisor.expertise || []);
        console.log('Max Students:', student.selectedSupervisorId.supervisor.maxStudents || 'Not set');
        console.log('Current Students:', student.selectedSupervisorId.supervisor.currentStudents || 'Not set');
      } else {
        console.log('No supervisor profile data found!');
      }

      // Let's also check if this supervisor has filled out their profile
      console.log('\n=== CHECKING SUPERVISOR USER PROFILE ===');
      const supervisorUser = await User.findById(student.selectedSupervisorId._id);
      if (supervisorUser && supervisorUser.supervisor) {
        console.log('Supervisor has profile data:');
        console.log('Department:', supervisorUser.supervisor.department || 'Not set');
        console.log('Designation:', supervisorUser.supervisor.designation || 'Not set');
        console.log('Phone:', supervisorUser.supervisor.phone || 'Not set');
        console.log('Office:', supervisorUser.supervisor.office || 'Not set');
        console.log('Office Hours:', supervisorUser.supervisor.officeHours || 'Not set');
      } else {
        console.log('Supervisor profile not found or incomplete');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkSupervisorData();