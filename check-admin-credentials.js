require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function checkAdminCredentials() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    console.log(`\n👤 Found ${adminUsers.length} admin user(s):`);
    
    for (const admin of adminUsers) {
      console.log(`\n📧 Email: ${admin.email}`);
      console.log(`👤 Name: ${admin.name}`);
      console.log(`✅ Verified: ${admin.isVerified}`);
      console.log(`📅 Created: ${admin.createdAt}`);
      console.log(`🔐 Password Hash: ${admin.password.substring(0, 20)}...`);
      
      // Test password against common admin passwords
      const commonPasswords = ['Admin@123', 'admin123', 'Admin123', 'admin@123'];
      
      for (const testPassword of commonPasswords) {
        const isMatch = await bcrypt.compare(testPassword, admin.password);
        console.log(`🔍 Testing "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
      }
    }
    
    // Also check if there are any users with admin-like emails
    console.log('\n🔍 Checking for admin-like users:');
    const adminLikeUsers = await User.find({ 
      email: { $regex: /admin|system/i } 
    }).select('name email role isVerified');
    
    adminLikeUsers.forEach(user => {
      console.log(`📧 ${user.email} - ${user.name} (${user.role}) - Verified: ${user.isVerified}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminCredentials();