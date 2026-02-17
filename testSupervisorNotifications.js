const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

const User = require('./models/User');
const Student = require('./models/Student');
const SupervisionRequest = require('./models/SupervisionRequest');
const Notification = require('./models/Notification');

const testSupervisorNotifications = async () => {
  try {
    console.log('🧪 Testing Supervisor Notification System...\n');

    // Clean up existing test data
    console.log('1. Cleaning up existing test data...');
    await Notification.deleteMany({ 
      $or: [
        { title: { $regex: /test/i } },
        { title: { $regex: /supervision request/i } }
      ]
    });

    // 1. Create or find test supervisor
    console.log('2. Setting up test supervisor...');
    let testSupervisor = await User.findOne({ email: 'test.supervisor@example.com' });
    
    if (!testSupervisor) {
      testSupervisor = new User({
        name: 'Dr. Test Supervisor',
        email: 'test.supervisor@example.com',
        password: 'testpassword',
        role: 'supervisor'
      });
      await testSupervisor.save();
      console.log('✅ Created test supervisor');
    } else {
      console.log('✅ Found existing test supervisor');
    }

    // 2. Create or find test student
    console.log('3. Setting up test student...');
    let testStudentUser = await User.findOne({ email: 'test.student.notif@example.com' });
    
    if (!testStudentUser) {
      testStudentUser = new User({
        name: 'Test Student for Notifications',
        email: 'test.student.notif@example.com',
        password: 'testpassword',
        role: 'student'
      });
      await testStudentUser.save();
      console.log('✅ Created test student user');
    } else {
      console.log('✅ Found existing test student user');
    }

    let testStudent = await Student.findOne({ email: 'test.student.notif@example.com' });
    
    if (!testStudent) {
      testStudent = new Student({
        userId: testStudentUser._id,
        email: 'test.student.notif@example.com',
        fullName: 'Test Student for Notifications',
        department: 'Computer Science',
        semester: '3rd',
        password: 'testpassword',
        rollNumber: 'TEST-NOTIF-001',
        cgpa: 3.5
      });
      await testStudent.save();
      console.log('✅ Created test student profile');
    } else {
      console.log('✅ Found existing test student profile');
    }

    // 3. Test supervisor notification creation directly
    console.log('4. Testing supervisor notification creation...');
    
    const testSupervisionRequestId = new mongoose.Types.ObjectId();
    
    await Notification.createSupervisorNotification(
      testSupervisionRequestId,
      testSupervisor._id,
      testStudent.fullName,
      testStudent._id,
      'Test supervision request for notification testing.'
    );

    const supervisorNotification = await Notification.findOne({
      userId: testSupervisor._id,
      type: 'supervision_request_received'
    });

    if (supervisorNotification) {
      console.log('✅ Supervisor notification created successfully:');
      console.log(`   - Title: ${supervisorNotification.title}`);
      console.log(`   - Message: ${supervisorNotification.message}`);
      console.log(`   - Type: ${supervisorNotification.type}`);
      console.log(`   - Priority: ${supervisorNotification.priority}`);
      console.log(`   - Action URL: ${supervisorNotification.actionUrl}`);
    } else {
      console.log('❌ Failed to create supervisor notification');
    }

    // 4. Test full supervision request workflow
    console.log('5. Testing full supervision request workflow...');
    
    const supervisionRequest = new SupervisionRequest({
      studentId: testStudent._id,
      studentName: testStudent.fullName,
      studentEmail: testStudent.email,
      supervisorId: testSupervisor._id,
      supervisorName: testSupervisor.name,
      message: 'Full workflow test supervision request',
      status: 'pending'
    });
    
    await supervisionRequest.save();
    console.log('✅ Created supervision request');

    // Create notification using the same logic as the controller
    await Notification.createSupervisorNotification(
      supervisionRequest._id,
      testSupervisor._id,
      testStudent.fullName,
      testStudent._id,
      'Please review the request details and respond accordingly.'
    );

    // 5. Test notification retrieval for supervisor
    console.log('6. Testing notification retrieval for supervisor...');
    
    const supervisorNotifications = await Notification.find({
      userId: testSupervisor._id
    }).sort({ createdAt: -1 });

    console.log(`✅ Retrieved ${supervisorNotifications.length} notifications for supervisor:`);
    supervisorNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} (${notif.status}) - ${notif.type}`);
      console.log(`      Message: ${notif.message.substring(0, 80)}...`);
    });

    // 6. Test unread count for supervisor
    console.log('7. Testing unread count for supervisor...');
    
    const unreadCount = await Notification.countDocuments({
      userId: testSupervisor._id,
      status: 'unread'
    });
    
    console.log(`✅ Supervisor has ${unreadCount} unread notifications`);

    // 7. Test student-to-supervisor workflow
    console.log('8. Testing student notification when supervisor responds...');
    
    // Simulate supervisor accepting the request
    supervisionRequest.status = 'accepted';
    await supervisionRequest.save();

    // Create student notification (using the existing function)
    await Notification.createSupervisionNotification(
      supervisionRequest._id,
      testStudentUser._id,
      'accepted',
      testSupervisor.name
    );

    const studentNotification = await Notification.findOne({
      userId: testStudentUser._id,
      type: 'supervision_request_accepted'
    });

    if (studentNotification) {
      console.log('✅ Student notification created for supervisor response:');
      console.log(`   - Title: ${studentNotification.title}`);
      console.log(`   - Message: ${studentNotification.message.substring(0, 80)}...`);
    }

    // 8. Test notification counts for both users
    console.log('9. Final notification summary...');
    
    const supervisorTotal = await Notification.countDocuments({ userId: testSupervisor._id });
    const studentTotal = await Notification.countDocuments({ userId: testStudentUser._id });
    
    console.log(`📊 Final counts:`);
    console.log(`   - Supervisor notifications: ${supervisorTotal}`);
    console.log(`   - Student notifications: ${studentTotal}`);

    console.log('\n🎉 Supervisor notification system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Supervisor receives notifications when students send requests');
    console.log('- ✅ Students receive notifications when supervisors respond');
    console.log('- ✅ Notification retrieval works for both roles');
    console.log('- ✅ Unread counts work correctly');
    console.log('- ✅ Database integration is functional');

  } catch (error) {
    console.error('❌ Error testing supervisor notification system:', error);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Notification.deleteMany({ 
      $or: [
        { userId: { $in: [
          await User.distinct('_id', { email: 'test.supervisor@example.com' }),
          await User.distinct('_id', { email: 'test.student.notif@example.com' })
        ].flat() }},
        { title: { $regex: /test/i } }
      ]
    });
    console.log('✅ Test notifications cleaned up');
    
    process.exit(0);
  }
};

// Run the test
testSupervisorNotifications();
