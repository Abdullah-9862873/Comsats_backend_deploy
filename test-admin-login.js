const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const testAdminLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://abdullahjav:class12b2@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@comsats.edu.pk', role: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Verified:', admin.isVerified);
    console.log('   Password hash length:', admin.password.length);

    // Test password comparison
    const testPassword = 'Admin@123';
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    console.log('\n🔐 Password Test:');
    console.log('   Test password:', testPassword);
    console.log('   Password matches:', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
      console.log('\n🔄 Resetting admin password...');
      const newHashedPassword = await bcrypt.hash('Admin@123', 12);
      await User.updateOne(
        { _id: admin._id },
        { password: newHashedPassword }
      );
      console.log('✅ Password reset successfully');
      
      // Test again
      const newAdmin = await User.findById(admin._id);
      const newMatch = await bcrypt.compare('Admin@123', newAdmin.password);
      console.log('   New password matches:', newMatch ? '✅ YES' : '❌ NO');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

testAdminLogin();