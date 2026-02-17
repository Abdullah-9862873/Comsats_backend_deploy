const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Demo users data
const demoUsers = [
  {
    name: 'Demo Student',
    email: 'student@comsats.edu.pk',
    password: 'Student@123',
    role: 'student',
    isVerified: true,
    rollNumber: 'SP21-BSE-001'
  },
  {
    name: 'Demo Company',
    email: 'company@comsats.edu.pk',
    password: 'Company@123',
    role: 'company',
    isVerified: true,
    companyName: 'Tech Solutions Inc.'
  },
  {
    name: 'Demo Supervisor',
    email: 'supervisor@comsats.edu.pk',
    password: 'Supervisor@123',
    role: 'supervisor',
    isVerified: true,
    department: 'Computer Science'
  }
];

const seedDemoUsers = async () => {
  try {
    console.log('🌱 Starting demo users seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected for demo seeding');

    // Create demo users
    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`✅ Demo user created: ${userData.email} (${userData.role})`);
      console.log(`📧 Email: ${userData.email}`);
      console.log(`🔑 Password: ${userData.password}`);
    }

    console.log('\n🎉 Demo users seeding completed successfully!');
    console.log('\n📋 Demo Login Credentials:');
    console.log('👨‍🎓 Student: student@comsats.edu.pk / Student@123');
    console.log('🏢 Company: company@comsats.edu.pk / Company@123');
    console.log('👨‍🏫 Supervisor: supervisor@comsats.edu.pk / Supervisor@123');
    console.log('🛡️  Admin: admin@comsats.edu.pk / Admin@123');

  } catch (error) {
    console.error('❌ Error seeding demo users:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedDemoUsers();