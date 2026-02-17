require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createTestUsers() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://abdullahjaved17032002:HcGOHfqJYbZeEhJV@cluster0.n5hjckh.mongodb.net/fyp_internship_system?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    // Hash password for test users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    
    const testUsers = [
      {
        name: 'John Student',
        email: 'john.student@example.com',
        password: hashedPassword,
        role: 'student',
        status: 'active',
        isVerified: true,
        student: {
          department: 'Computer Science',
          semester: '8th',
          regNo: 'SP21-BCS-001'
        }
      },
      {
        name: 'Dr. Sarah Wilson',
        email: 'sarah.wilson@comsats.edu.pk',
        password: hashedPassword,
        role: 'supervisor',
        status: 'active',
        isVerified: true,
        supervisor: {
          department: 'Computer Science',
          designation: 'Assistant Professor'
        }
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@techcorp.com',
        password: hashedPassword,
        role: 'company',
        status: 'pending',
        isVerified: false
      },
      {
        name: 'Emma Davis',
        email: 'emma.davis@example.com',
        password: hashedPassword,
        role: 'student',
        status: 'inactive',
        isVerified: true,
        student: {
          department: 'Software Engineering',
          semester: '6th',
          regNo: 'SP22-SE-015'
        }
      }
    ];
    
    // Check if users already exist
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.name} (${userData.email})`);
      } else {
        console.log(`ℹ️  User already exists: ${userData.email}`);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Test users creation completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUsers();