const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/Fyp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('🔗 Connected to MongoDB');

  try {
    // Clear existing data
    await User.deleteMany({});
    console.log('🗑️ Cleared existing user data');

    // Create test students with proper profile data
    const testStudents = [
      {
        name: 'John Smith',
        email: 'john.smith@student.edu',
        password: await bcrypt.hash('password123', 10),
        role: 'student',
        isVerified: true,
        student: {
          regNo: 'FA21-BSE-101',
          department: 'Computer Science',
          semester: '7th'
        }
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@student.edu',
        password: await bcrypt.hash('password123', 10),
        role: 'student',
        isVerified: true,
        student: {
          regNo: 'FA21-BSE-102',
          department: 'Software Engineering',
          semester: '6th'
        }
      },
      {
        name: 'Ahmed Ali',
        email: 'ahmed.ali@student.edu',
        password: await bcrypt.hash('password123', 10),
        role: 'student',
        isVerified: true,
        student: {
          regNo: 'FA21-BSE-103',
          department: 'Information Technology',
          semester: '8th'
        }
      }
    ];

    // Create test supervisors
    const testSupervisors = [
      {
        name: 'Dr. Michael Davis',
        email: 'michael.davis@university.edu',
        password: await bcrypt.hash('password123', 10),
        role: 'supervisor',
        isVerified: true,
        supervisor: {
          department: 'Computer Science',
          designation: 'Associate Professor',
          expertise: ['Machine Learning', 'Data Science'],
          phone: '+1-555-0101',
          office: 'CS-201',
          maxStudents: 15
        }
      },
      {
        name: 'Dr. Lisa Wilson',
        email: 'lisa.wilson@university.edu',
        password: await bcrypt.hash('password123', 10),
        role: 'supervisor',
        isVerified: true,
        supervisor: {
          department: 'Software Engineering',
          designation: 'Professor',
          expertise: ['Web Development', 'Software Architecture'],
          phone: '+1-555-0102',
          office: 'SE-301'
        }
      }
    ];

    // Create test companies
    const testCompanies = [
      {
        name: 'TechCorp Solutions',
        email: 'hr@techcorp.com',
        password: await bcrypt.hash('password123', 10),
        role: 'company',
        isVerified: true,
        company: {
          companyName: 'TechCorp Solutions',
          industry: 'Technology',
          website: 'https://techcorp.com',
          about: 'Leading technology solutions provider'
        }
      },
      {
        name: 'InnovateTech Inc',
        email: 'careers@innovatetech.com',
        password: await bcrypt.hash('password123', 10),
        role: 'company',
        isVerified: true,
        company: {
          companyName: 'InnovateTech Inc',
          industry: 'Software Development',
          website: 'https://innovatetech.com',
          about: 'Innovative software development company'
        }
      }
    ];

    // Insert all users
    const allUsers = [...testStudents, ...testSupervisors, ...testCompanies];
    const createdUsers = await User.insertMany(allUsers);

    console.log('🎉 Created test users:');
    console.log(`   📚 Students: ${testStudents.length}`);
    console.log(`   👨‍🏫 Supervisors: ${testSupervisors.length}`);
    console.log(`   🏢 Companies: ${testCompanies.length}`);

    // Display created users with their IDs
    console.log('\n📋 Created user details:');
    createdUsers.forEach(user => {
      const roleData = user.student || user.supervisor || user.company || {};
      console.log(`   ${user.role.toUpperCase()}: ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      if (user.student) {
        console.log(`   Registration: ${user.student.regNo}, Department: ${user.student.department}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔚 Disconnected from MongoDB');
  }
}).catch(error => {
  console.error('❌ Failed to connect to MongoDB:', error);
});