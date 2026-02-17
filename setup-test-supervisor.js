require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');

const ensureTestSupervisorData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first supervisor and update their profile with complete data
    const supervisor = await User.findOne({ role: 'supervisor' });
    
    if (!supervisor) {
      console.log('No supervisor found');
      return;
    }

    console.log(`Found supervisor: ${supervisor.name} (${supervisor.email})`);

    // Update supervisor with complete profile data
    supervisor.supervisor = {
      department: 'Computer Science',
      designation: 'Professor',
      maxStudents: 15,
      currentStudents: supervisor.supervisor?.currentStudents || 0,
      expertise: ['Machine Learning', 'Data Science', 'Software Engineering'],
      phone: '+92-300-1234567',
      office: 'CS-210',
      officeHours: 'Mon-Wed-Fri, 2PM-4PM'
    };

    await supervisor.save();
    console.log('✅ Updated supervisor profile with complete data');

    // Check if any student is assigned to this supervisor
    const assignedStudent = await Student.findOne({ selectedSupervisorId: supervisor._id });
    
    if (assignedStudent) {
      console.log(`✅ Found assigned student: ${assignedStudent.fullName}`);
    } else {
      console.log('No student assigned to this supervisor yet');
      
      // Find a student without supervisor and assign them
      const studentWithoutSupervisor = await Student.findOne({ selectedSupervisorId: null });
      
      if (studentWithoutSupervisor) {
        studentWithoutSupervisor.selectedSupervisorId = supervisor._id;
        await studentWithoutSupervisor.save();
        console.log(`✅ Assigned supervisor to student: ${studentWithoutSupervisor.fullName}`);
      }
    }

    // Verify the data by fetching it back
    console.log('\n=== VERIFICATION ===');
    const studentWithSupervisor = await Student.findOne({ 
      selectedSupervisorId: supervisor._id 
    }).populate('selectedSupervisorId');

    if (studentWithSupervisor && studentWithSupervisor.selectedSupervisorId) {
      const sup = studentWithSupervisor.selectedSupervisorId;
      console.log('Student:', studentWithSupervisor.fullName);
      console.log('Supervisor name:', sup.name);
      console.log('Supervisor department:', sup.supervisor?.department);
      console.log('Supervisor designation:', sup.supervisor?.designation);
      console.log('Supervisor phone:', sup.supervisor?.phone);
      console.log('Supervisor office:', sup.supervisor?.office);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

ensureTestSupervisorData();