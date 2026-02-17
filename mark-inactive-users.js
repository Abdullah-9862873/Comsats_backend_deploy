require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function markInactiveUsers() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    // Define inactivity period (e.g., 90 days)
    const INACTIVITY_PERIOD_DAYS = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_PERIOD_DAYS);
    
    console.log(`🔍 Looking for users inactive since: ${cutoffDate.toLocaleDateString()}`);
    
    // Find users who haven't logged in for the specified period
    // Users with lastLogin before cutoffDate OR lastLogin is null (never logged in) AND created before cutoffDate
    const inactiveUsers = await User.find({
      $and: [
        { role: { $ne: 'admin' } }, // Don't mark admins as inactive
        { status: { $ne: 'inactive' } }, // Don't process already inactive users
        {
          $or: [
            { 
              lastLogin: { $lt: cutoffDate } // Last login was before cutoff
            },
            { 
              lastLogin: null, // Never logged in
              createdAt: { $lt: cutoffDate } // Account created before cutoff
            }
          ]
        }
      ]
    });
    
    console.log(`\n📊 Found ${inactiveUsers.length} users to mark as inactive:`);
    
    if (inactiveUsers.length === 0) {
      console.log('✅ No users found that need to be marked as inactive.');
      await mongoose.disconnect();
      return;
    }
    
    // Show users before marking them inactive
    inactiveUsers.forEach((user, index) => {
      const lastLoginText = user.lastLogin ? 
        user.lastLogin.toLocaleDateString() : 
        'Never logged in';
      
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role} | Status: ${user.status} | Last Login: ${lastLoginText}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    });
    
    // Ask for confirmation (in a real scenario, you might want manual confirmation)
    console.log(`\n⚠️  This will mark ${inactiveUsers.length} users as inactive.`);
    console.log('📝 Users marked as inactive will not be able to login until admin reactivates them.');
    
    // Mark users as inactive
    const result = await User.updateMany(
      { _id: { $in: inactiveUsers.map(u => u._id) } },
      { 
        status: 'inactive',
        lastActivity: new Date()
      }
    );
    
    console.log(`\n✅ Successfully marked ${result.modifiedCount} users as inactive.`);
    
    // Show summary
    const statusCounts = inactiveUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📋 Summary by role:');
    Object.entries(statusCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

// You can also run this function with different periods
async function markInactiveUsersWithPeriod(days) {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const count = await User.countDocuments({
      $and: [
        { role: { $ne: 'admin' } },
        { status: { $ne: 'inactive' } },
        {
          $or: [
            { lastLogin: { $lt: cutoffDate } },
            { 
              lastLogin: null,
              createdAt: { $lt: cutoffDate }
            }
          ]
        }
      ]
    });
    
    console.log(`\n📊 Users that would be marked inactive (${days} days): ${count}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const command = args[0];
  if (command === 'check') {
    // Check how many users would be affected with different periods
    console.log('🔍 Checking inactive users with different periods...');
    (async () => {
      await markInactiveUsersWithPeriod(30); // 30 days
      await markInactiveUsersWithPeriod(60); // 60 days  
      await markInactiveUsersWithPeriod(90); // 90 days
    })();
  } else if (command === 'run') {
    // Actually mark users as inactive
    markInactiveUsers();
  } else {
    console.log('Usage:');
    console.log('  node mark-inactive-users.js check  - Check how many users would be affected');
    console.log('  node mark-inactive-users.js run    - Actually mark users as inactive');
  }
} else {
  console.log('Usage:');
  console.log('  node mark-inactive-users.js check  - Check how many users would be affected');
  console.log('  node mark-inactive-users.js run    - Actually mark users as inactive');
}