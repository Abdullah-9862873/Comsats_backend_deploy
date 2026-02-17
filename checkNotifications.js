const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const Notification = require('./models/Notification');
const User = require('./models/User');

const checkNotifications = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const supervisor = await User.findOne({ name: 'Jamal' });
    console.log('✅ Found supervisor:', supervisor.name);

    const notifications = await Notification.find({ userId: supervisor._id }).sort({ createdAt: -1 }).limit(3);
    
    console.log('\n📧 Recent notifications for supervisor Jamal:');
    if (notifications.length === 0) {
      console.log('   No notifications found');
    } else {
      notifications.forEach((n, i) => {
        console.log(`   ${i + 1}. ${n.title}`);
        console.log(`      ${n.message}`);
        console.log(`      Read: ${n.isRead ? 'Yes' : 'No'}`);
        console.log(`      Created: ${n.createdAt}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkNotifications();
