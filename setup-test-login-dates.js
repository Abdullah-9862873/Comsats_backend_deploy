require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateTestUsersLastLogin() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    // Set different lastLogin dates for testing with existing users
    const updates = [
      {
        email: 'muhammadfakharulhasnain6@gmail.com',
        lastLogin: new Date('2025-07-01'), // ~130 days ago
        description: '130 days ago (should be marked inactive)'
      },
      {
        email: 'abdullahjave634@gmail.com', 
        lastLogin: new Date('2025-09-15'), // ~55 days ago
        description: '55 days ago (borderline for 90-day cutoff)'
      },
      {
        email: 'dazaiosamu2578@gmail.com',
        lastLogin: new Date('2025-08-01'), // ~100 days ago
        description: '100 days ago (should be marked inactive)'
      },
      {
        email: 'javabdullah634@gmail.com',
        lastLogin: new Date('2025-11-08'), // Recent
        description: 'Recent login (should stay active)'
      }
    ];
    
    for (const update of updates) {
      const result = await User.updateOne(
        { email: update.email },
        { lastLogin: update.lastLogin }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${update.email}: ${update.description}`);
      } else {
        console.log(`⚠️  User not found: ${update.email}`);
      }
    }
    
    // Show current state
    console.log('\n📊 Current user login status:');
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('name email role lastLogin createdAt status')
      .sort({ lastLogin: 1 });
      
    users.forEach(user => {
      const lastLoginText = user.lastLogin ? 
        user.lastLogin.toLocaleDateString() : 'Never';
      console.log(`${user.name} (${user.email}) - ${user.role} - Last: ${lastLoginText} - Status: ${user.status}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateTestUsersLastLogin();