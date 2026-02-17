require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');

const checkSupervisorProfiles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all supervisors
    const supervisors = await User.find({ role: 'supervisor' });
    console.log(`Found ${supervisors.length} supervisors`);

    console.log('\n=== SUPERVISOR PROFILE ANALYSIS ===');
    
    for (const supervisor of supervisors) {
      console.log(`\nSupervisor: ${supervisor.name} (${supervisor.email})`);
      console.log(`ID: ${supervisor._id}`);
      
      if (supervisor.supervisor) {
        console.log('Profile data available:');
        console.log(`  - Department: ${supervisor.supervisor.department || 'Not set'}`);
        console.log(`  - Designation: ${supervisor.supervisor.designation || 'Not set'}`);
        console.log(`  - Phone: ${supervisor.supervisor.phone || 'Not set'}`);
        console.log(`  - Office: ${supervisor.supervisor.office || 'Not set'}`);
        console.log(`  - Office Hours: ${supervisor.supervisor.officeHours || 'Not set'}`);
        console.log(`  - Max Students: ${supervisor.supervisor.maxStudents || 'Not set'}`);
        console.log(`  - Current Students: ${supervisor.supervisor.currentStudents || 0}`);
        console.log(`  - Expertise: ${supervisor.supervisor.expertise?.length || 0} items`);
      } else {
        console.log('❌ NO PROFILE DATA - supervisor field is empty/null');
      }

      // Check if any students are assigned to this supervisor
      const assignedStudents = await Student.find({ selectedSupervisorId: supervisor._id });
      console.log(`Students assigned: ${assignedStudents.length}`);
      
      if (assignedStudents.length > 0) {
        console.log('Assigned students:');
        for (const student of assignedStudents) {
          console.log(`  - ${student.fullName} (${student.email})`);
        }
      }
    }

    // Check if there are students with selectedSupervisorId but supervisor has no profile
    console.log('\n=== STUDENTS WITH SUPERVISORS ===');
    const studentsWithSupervisors = await Student.find({ 
      selectedSupervisorId: { $ne: null } 
    }).populate('selectedSupervisorId');

    for (const student of studentsWithSupervisors) {
      console.log(`\nStudent: ${student.fullName}`);
      console.log(`Supervisor: ${student.selectedSupervisorId?.name}`);
      console.log(`Supervisor has profile: ${student.selectedSupervisorId?.supervisor ? 'YES' : 'NO'}`);
      
      if (student.selectedSupervisorId?.supervisor) {
        const profile = student.selectedSupervisorId.supervisor;
        console.log(`  Department: ${profile.department || 'Not set'}`);
        console.log(`  Designation: ${profile.designation || 'Not set'}`);
        console.log(`  Phone: ${profile.phone || 'Not set'}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkSupervisorProfiles();