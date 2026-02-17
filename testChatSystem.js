const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-internship-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testChatSystem() {
  try {
    console.log('🔍 Testing Chat System Setup...');
    
    // Find supervisors
    const supervisors = await User.find({ role: 'supervisor' }).limit(5);
    console.log(`📋 Found ${supervisors.length} supervisors`);
    
    // Find students
    const students = await Student.find({}).limit(5);
    console.log(`👥 Found ${students.length} students`);
    
    // Check students with assigned supervisors
    const studentsWithSupervisors = await Student.find({ 
      selectedSupervisorId: { $ne: null } 
    }).populate('selectedSupervisorId', 'name email');
    
    console.log(`✅ Students with assigned supervisors: ${studentsWithSupervisors.length}`);
    
    if (studentsWithSupervisors.length === 0 && supervisors.length > 0 && students.length > 0) {
      console.log('🔧 Assigning a supervisor to a student for testing...');
      
      const testStudent = students[0];
      const testSupervisor = supervisors[0];
      
      testStudent.selectedSupervisorId = testSupervisor._id;
      await testStudent.save();
      
      console.log(`✅ Assigned supervisor ${testSupervisor.name} to student ${testStudent.fullName}`);
    }
    
    // List students with supervisors
    const updatedStudentsWithSupervisors = await Student.find({ 
      selectedSupervisorId: { $ne: null } 
    }).populate('selectedSupervisorId', 'name email');
    
    console.log('\n📋 Students with Supervisors:');
    updatedStudentsWithSupervisors.forEach(student => {
      console.log(`- ${student.fullName} -> ${student.selectedSupervisorId.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testChatSystem();