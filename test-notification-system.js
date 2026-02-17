const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/internship-portal')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    testUnreadCounts();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

const SupervisorChat = require('./models/SupervisorChat');
const Student = require('./models/Student');
const User = require('./models/User');

async function testUnreadCounts() {
  try {
    console.log('\n🔍 Testing Unread Message Count System...\n');

    // Find a test student
    const testStudent = await Student.findOne().populate('selectedSupervisorId');
    
    if (!testStudent) {
      console.log('❌ No students found in database');
      return;
    }

    console.log(`📝 Testing with student: ${testStudent.fullName} (${testStudent.email})`);

    if (!testStudent.selectedSupervisorId) {
      console.log('❌ Student has no supervisor assigned');
      return;
    }

    console.log(`👨‍🏫 Supervisor: ${testStudent.selectedSupervisorId.name}`);

    // Find chat between student and supervisor
    const chat = await SupervisorChat.findOne({
      studentId: testStudent._id,
      supervisorId: testStudent.selectedSupervisorId._id
    });

    if (!chat) {
      console.log('❌ No chat found between student and supervisor');
      return;
    }

    console.log(`💬 Chat found with ${chat.messages.length} messages`);

    // Count unread messages from supervisor to student
    let unreadFromSupervisor = 0;
    let unreadFromStudent = 0;

    chat.messages.forEach(message => {
      if (message.senderType === 'supervisor' && !message.isRead) {
        unreadFromSupervisor++;
      }
      if (message.senderType === 'student' && !message.isRead) {
        unreadFromStudent++;
      }
    });

    console.log(`\n📊 Unread Message Count Results:`);
    console.log(`   🔴 Unread from supervisor (for student): ${unreadFromSupervisor}`);
    console.log(`   🔴 Unread from student (for supervisor): ${unreadFromStudent}`);

    // Test marking supervisor messages as read for student
    console.log(`\n🔄 Testing mark supervisor messages as read...`);
    
    const updateResult = await SupervisorChat.updateOne(
      { 
        studentId: testStudent._id,
        supervisorId: testStudent.selectedSupervisorId._id
      },
      { 
        $set: { 
          'messages.$[elem].isRead': true 
        } 
      },
      { 
        arrayFilters: [{ 
          'elem.senderType': 'supervisor', 
          'elem.isRead': false 
        }] 
      }
    );

    console.log(`✅ Update result: ${updateResult.modifiedCount} messages marked as read`);

    // Re-check unread count
    const updatedChat = await SupervisorChat.findOne({
      studentId: testStudent._id,
      supervisorId: testStudent.selectedSupervisorId._id
    });

    let newUnreadFromSupervisor = 0;
    updatedChat.messages.forEach(message => {
      if (message.senderType === 'supervisor' && !message.isRead) {
        newUnreadFromSupervisor++;
      }
    });

    console.log(`📊 After marking as read: ${newUnreadFromSupervisor} unread supervisor messages`);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}