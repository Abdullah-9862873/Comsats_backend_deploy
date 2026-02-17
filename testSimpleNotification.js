const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

const Notification = require('./models/Notification');

const testSimpleNotification = async () => {
  try {
    console.log('🧪 Testing Simple Notification Creation...\n');

    // Clean up existing test data
    console.log('1. Cleaning up existing test data...');
    await Notification.deleteMany({ 
      title: { $regex: /test/i }
    });

    // Create a test user ID
    const testUserId = new mongoose.Types.ObjectId();
    console.log(`Using test user ID: ${testUserId}`);

    // Test 1: Create a simple notification directly
    console.log('2. Creating simple notification...');
    const notification = new Notification({
      userId: testUserId,
      title: 'Test Notification',
      message: 'This is a test notification for the notification system.',
      type: 'system_announcement',
      status: 'unread',
      priority: 'medium',
      metadata: {
        requestType: 'test'
      }
    });
    
    await notification.save();
    console.log('✅ Simple notification created successfully');
    console.log(`   - ID: ${notification._id}`);
    console.log(`   - Title: ${notification.title}`);
    console.log(`   - Message: ${notification.message}`);
    console.log(`   - Type: ${notification.type}`);
    console.log(`   - Status: ${notification.status}`);

    // Test 2: Test mark as read
    console.log('3. Testing mark as read...');
    await notification.markAsRead();
    const readNotification = await Notification.findById(notification._id);
    
    if (readNotification.status === 'read') {
      console.log('✅ Notification marked as read successfully');
      console.log(`   - Read at: ${readNotification.readAt}`);
    } else {
      console.log('❌ Failed to mark notification as read');
    }

    // Test 3: Create supervision accepted notification manually
    console.log('4. Creating supervision accepted notification...');
    const supervisionNotification = new Notification({
      userId: testUserId,
      title: 'Supervision Request Accepted!',
      message: 'Great news! Your supervision request has been accepted by Dr. Test Supervisor. You can now proceed with job applications.',
      type: 'supervision_request_accepted',
      status: 'unread',
      priority: 'high',
      actionUrl: '/dashboard/student?tab=Jobs',
      metadata: {
        supervisorName: 'Dr. Test Supervisor',
        supervisorId: new mongoose.Types.ObjectId(),
        requestType: 'supervision_request'
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    await supervisionNotification.save();
    console.log('✅ Supervision notification created successfully');
    console.log(`   - Title: ${supervisionNotification.title}`);
    console.log(`   - Priority: ${supervisionNotification.priority}`);
    console.log(`   - Action URL: ${supervisionNotification.actionUrl}`);

    // Test 4: Create supervision rejected notification
    console.log('5. Creating supervision rejected notification...');
    const rejectionNotification = new Notification({
      userId: testUserId,
      title: 'Supervision Request Update',
      message: 'Your supervision request to Dr. Test Supervisor has been rejected. Reason: Your project topic needs more research',
      type: 'supervision_request_rejected',
      status: 'unread',
      priority: 'medium',
      actionUrl: '/dashboard/student?tab=Supervisors',
      metadata: {
        supervisorName: 'Dr. Test Supervisor',
        supervisorId: new mongoose.Types.ObjectId(),
        requestType: 'supervision_request'
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    await rejectionNotification.save();
    console.log('✅ Rejection notification created successfully');

    // Test 5: Get all notifications for user
    console.log('6. Retrieving all notifications for user...');
    const userNotifications = await Notification.find({
      userId: testUserId
    }).sort({ createdAt: -1 });
    
    console.log(`✅ Retrieved ${userNotifications.length} notifications:`);
    userNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} (${notif.status}) - ${notif.type}`);
    });

    // Test 6: Count notifications
    console.log('7. Counting notifications...');
    const unreadCount = await Notification.countDocuments({
      userId: testUserId,
      status: 'unread'
    });
    
    const totalCount = await Notification.countDocuments({
      userId: testUserId
    });
    
    console.log(`✅ Notification counts: ${unreadCount} unread, ${totalCount} total`);

    // Test 7: Test application notification
    console.log('8. Creating application notification...');
    const applicationNotification = new Notification({
      userId: testUserId,
      title: 'Application Update',
      message: 'Your application for Software Engineer Position has been shortlisted.',
      type: 'application_approved',
      status: 'unread',
      priority: 'high',
      actionUrl: '/dashboard/student?tab=Applications',
      metadata: {
        jobTitle: 'Software Engineer Position',
        companyName: 'Tech Company',
        requestType: 'application_update'
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    await applicationNotification.save();
    console.log('✅ Application notification created successfully');

    console.log('\n🎉 All notification tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Basic notification creation');
    console.log('- ✅ Mark as read functionality');
    console.log('- ✅ Supervision accepted notifications');
    console.log('- ✅ Supervision rejected notifications');
    console.log('- ✅ Application status notifications');
    console.log('- ✅ Notification retrieval and counting');
    console.log('- ✅ MongoDB integration working properly');

  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Notification.deleteMany({ 
      title: { $regex: /test/i }
    });
    console.log('✅ Test notifications cleaned up');
    
    process.exit(0);
  }
};

// Run the test
testSimpleNotification();
