const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const SupervisorChat = require('./models/SupervisorChat');

async function testStudentChatFix() {
  try {
    await mongoose.connect('mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');
    
    // Simulate the same logic as our controller
    const userId = '68ba82771d183b72f0085585'; // Student_1's User ID
    
    console.log('\n=== TESTING STUDENT CHAT FIX ===');
    console.log(`Testing with User ID: ${userId}`);
    
    // Step 1: Find User by ID (like our auth middleware)
    const user = await User.findById(userId);
    console.log(`\n1. User found: ${user ? user.username : 'Not found'}`);
    console.log(`   User email: ${user ? user.email : 'N/A'}`);
    
    if (!user) {
      console.log('❌ User not found - test failed');
      return;
    }
    
    // Step 2: Find Student by email (case-insensitive)
    const student = await Student.findOne({ 
      email: { $regex: new RegExp(`^${user.email}$`, 'i') }
    });
    console.log(`\n2. Student found: ${student ? 'Yes' : 'No'}`);
    console.log(`   Student ID: ${student ? student._id : 'N/A'}`);
    console.log(`   Student email: ${student ? student.email : 'N/A'}`);
    
    if (!student) {
      console.log('❌ Student record not found - test failed');
      return;
    }
    
    // Step 3: Look for chats using the actual Student ID
    const actualStudentId = student._id;
    const chats = await SupervisorChat.find({ studentId: actualStudentId });
    console.log(`\n3. Chats found with Student ID: ${chats.length}`);
    
    if (chats.length > 0) {
      console.log('\n📧 CHAT DETAILS:');
      chats.forEach((chat, index) => {
        console.log(`\nChat ${index + 1}:`);
        console.log(`   Supervisor ID: ${chat.supervisorId}`);
        console.log(`   Student ID: ${chat.studentId}`);
        console.log(`   Total messages: ${chat.messages.length}`);
        
        const supervisorMessages = chat.messages.filter(msg => msg.senderType === 'supervisor');
        const studentMessages = chat.messages.filter(msg => msg.senderType === 'student');
        
        console.log(`   Supervisor messages: ${supervisorMessages.length}`);
        console.log(`   Student messages: ${studentMessages.length}`);
        
        if (supervisorMessages.length > 0) {
          console.log('\n   📨 Supervisor Messages:');
          supervisorMessages.forEach((msg, msgIndex) => {
            console.log(`      ${msgIndex + 1}. "${msg.message.substring(0, 60)}..." (${msg.timestamp})`);
          });
        }
      });
      
      console.log('\n✅ SUCCESS: Student_1 should now be able to see supervisor messages!');
    } else {
      console.log('❌ No chats found even with correct Student ID');
      
      // Let's check if there are any chats with the old User ID for comparison
      const oldChats = await SupervisorChat.find({ studentId: userId });
      console.log(`   Chats with old User ID: ${oldChats.length}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testStudentChatFix();
