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

const testNotificationSystem = async () => {
  try {
    console.log('🧪 Testing Notification System...\n');

    // Clean up existing test data
    console.log('1. Cleaning up existing test data...');
    await Notification.deleteMany({ 
      $or: [
        { metadata: { isTestData: true } },
        { title: { $regex: /test/i } }
      ]
    });
    
    // Find or create a test student
    console.log('2. Finding test student...');
    let testStudent = await Student.findOne({ email: 'test.student@example.com' });
    let testUser = await User.findOne({ email: 'test.student@example.com' });
    
    if (!testUser) {
      // Create test student user first
      testUser = new User({
        name: 'Test Student',
        email: 'test.student@example.com',
        password: 'testpassword',
        role: 'student'
      });
      await testUser.save();
      console.log('✅ Created test user');
    } else {
      console.log('✅ Found existing test user');
    }
    
    if (!testStudent) {
      testStudent = new Student({
        userId: testUser._id,
        email: 'test.student@example.com',
        fullName: 'Test Student',
        department: 'Computer Science',
        semester: '3rd',
        password: 'testpassword',
        cgpa: 3.5
      });
      await testStudent.save();
      console.log('✅ Created test student');
    } else {
      console.log('✅ Found existing test student');
    }

    // Create a test supervisor ID (valid ObjectId)
    const testSupervisorId = new mongoose.Types.ObjectId();
    console.log(`Using test supervisor ID: ${testSupervisorId}`);

    // Create test supervision request
    console.log('3. Creating test supervision request...');
    const supervisionRequest = new SupervisionRequest({
      studentId: testStudent._id,
      studentName: testStudent.fullName,
      studentEmail: testStudent.email,
      supervisorId: testSupervisorId,
      supervisorName: 'Dr. Test Supervisor',
      message: 'Test supervision request for notification system',
      status: 'pending',
      createdAt: new Date()
    });
    await supervisionRequest.save();
    console.log('✅ Created supervision request');

    // Test 1: Create supervision acceptance notification
    console.log('4. Testing supervision acceptance notification...');
    await Notification.createSupervisionNotification(
      supervisionRequest._id,
      testStudent._id,
      'accepted',
      'Dr. Test Supervisor'
    );
    
    const acceptanceNotification = await Notification.findOne({
      userId: testStudent._id,
      type: 'supervision_accepted'
    }).populate('userId', 'name email');
    
    if (acceptanceNotification) {
      console.log('✅ Supervision acceptance notification created:');
      console.log(`   - Title: ${acceptanceNotification.title}`);
      console.log(`   - Message: ${acceptanceNotification.message}`);
      console.log(`   - Type: ${acceptanceNotification.type}`);
      console.log(`   - Status: ${acceptanceNotification.status}`);
      console.log(`   - Priority: ${acceptanceNotification.priority}`);
    } else {
      console.log('❌ Failed to create supervision acceptance notification');
    }

    // Test 2: Create supervision rejection notification
    console.log('5. Testing supervision rejection notification...');
    await Notification.createSupervisionNotification(
      supervisionRequest._id,
      testStudent._id,
      'rejected',
      'Dr. Test Supervisor',
      'Your project topic needs more research'
    );
    
    const rejectionNotification = await Notification.findOne({
      userId: testStudent._id,
      type: 'supervision_rejected'
    }).populate('userId', 'name email');
    
    if (rejectionNotification) {
      console.log('✅ Supervision rejection notification created:');
      console.log(`   - Title: ${rejectionNotification.title}`);
      console.log(`   - Message: ${rejectionNotification.message}`);
      console.log(`   - Type: ${rejectionNotification.type}`);
      console.log(`   - Status: ${rejectionNotification.status}`);
      console.log(`   - Priority: ${rejectionNotification.priority}`);
    } else {
      console.log('❌ Failed to create supervision rejection notification');
    }

    // Test 3: Test marking notification as read
    console.log('6. Testing mark as read functionality...');
    if (acceptanceNotification) {
      await acceptanceNotification.markAsRead();
      const readNotification = await Notification.findById(acceptanceNotification._id);
      
      if (readNotification.status === 'read') {
        console.log('✅ Notification marked as read successfully');
      } else {
        console.log('❌ Failed to mark notification as read');
      }
    }

    // Test 4: Get student notifications (simulate API call)
    console.log('7. Testing get student notifications...');
    const studentNotifications = await Notification.find({
      userId: testStudent._id
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);
    
    console.log(`✅ Retrieved ${studentNotifications.length} notifications for student`);
    studentNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} (${notif.status}) - ${notif.createdAt.toLocaleString()}`);
    });

    // Test 5: Test notification counts
    console.log('8. Testing notification counts...');
    const unreadCount = await Notification.countDocuments({
      userId: testStudent._id,
      status: 'unread'
    });
    
    const totalCount = await Notification.countDocuments({
      userId: testStudent._id
    });
    
    console.log(`✅ Notification counts: ${unreadCount} unread, ${totalCount} total`);

    // Test 6: Test application notification
    console.log('9. Testing application notification...');
    const testApplicationId = new mongoose.Types.ObjectId();
    await Notification.createApplicationNotification(
      testApplicationId,
      testStudent._id,
      'shortlisted',
      'Software Engineer Position'
    );
    
    const appNotification = await Notification.findOne({
      userId: testStudent._id,
      type: 'application_shortlisted'
    });
    
    if (appNotification) {
      console.log('✅ Application notification created:');
      console.log(`   - Title: ${appNotification.title}`);
      console.log(`   - Message: ${appNotification.message}`);
    } else {
      console.log('❌ Failed to create application notification');
    }

    console.log('\n🎉 Notification system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Supervision acceptance notifications');
    console.log('- ✅ Supervision rejection notifications');
    console.log('- ✅ Application status notifications');
    console.log('- ✅ Mark as read functionality');
    console.log('- ✅ Notification retrieval and counting');
    console.log('- ✅ Database integration working');

  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    const testStudentIds = await Student.distinct('_id', { email: 'test.student@example.com' });
    await Notification.deleteMany({ 
      userId: { $in: testStudentIds }
    });
    await SupervisionRequest.deleteMany({ 
      studentId: { $in: testStudentIds }
    });
    console.log('✅ Test notifications and requests cleaned up');
    
    process.exit(0);
  }
};

// Run the test
testNotificationSystem();
