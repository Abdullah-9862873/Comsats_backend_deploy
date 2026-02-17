const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const testSupervisors = [
  {
    name: 'Dr. Ahmed Khan',
    email: 'ahmed.khan@comsats.edu.pk',
    password: 'supervisor123',
    role: 'supervisor',
    supervisor: {
      department: 'Computer Science',
      designation: 'Assistant Professor',
      maxStudents: 8,
      currentStudents: 3,
      expertise: ['Machine Learning', 'Data Science', 'Python', 'Research'],
      phone: '+92-51-9049-4321',
      office: 'Room 301, CS Department',
      officeHours: 'Mon-Wed-Fri, 10AM-12PM'
    }
  },
  {
    name: 'Dr. Sarah Ali',
    email: 'sarah.ali@comsats.edu.pk',
    password: 'supervisor123',
    role: 'supervisor',
    supervisor: {
      department: 'Software Engineering',
      designation: 'Associate Professor',
      maxStudents: 10,
      currentStudents: 5,
      expertise: ['Web Development', 'Software Architecture', 'JavaScript', 'React'],
      phone: '+92-51-9049-4322',
      office: 'Room 205, SE Department',
      officeHours: 'Tue-Thu, 2PM-4PM'
    }
  },
  {
    name: 'Dr. Muhammad Hassan',
    email: 'hassan@comsats.edu.pk',
    password: 'supervisor123',
    role: 'supervisor',
    supervisor: {
      department: 'Information Technology',
      designation: 'Professor',
      maxStudents: 12,
      currentStudents: 8,
      expertise: ['Cybersecurity', 'Network Administration', 'Cloud Computing', 'DevOps'],
      phone: '+92-51-9049-4323',
      office: 'Room 401, IT Department',
      officeHours: 'Mon-Fri, 9AM-11AM'
    }
  },
  {
    name: 'Dr. Fatima Sheikh',
    email: 'fatima.sheikh@comsats.edu.pk',
    password: 'supervisor123',
    role: 'supervisor',
    supervisor: {
      department: 'Computer Science',
      designation: 'Assistant Professor',
      maxStudents: 6,
      currentStudents: 6,
      expertise: ['Artificial Intelligence', 'Deep Learning', 'Computer Vision', 'Python'],
      phone: '+92-51-9049-4324',
      office: 'Room 302, CS Department',
      officeHours: 'Tue-Thu, 11AM-1PM'
    }
  },
  {
    name: 'Dr. Usman Ahmad',
    email: 'usman.ahmad@comsats.edu.pk',
    password: 'supervisor123',
    role: 'supervisor',
    supervisor: {
      department: 'Software Engineering',
      designation: 'Associate Professor',
      maxStudents: 9,
      currentStudents: 2,
      expertise: ['Mobile Development', 'Flutter', 'Android', 'iOS'],
      phone: '+92-51-9049-4325',
      office: 'Room 206, SE Department',
      officeHours: 'Mon-Wed, 3PM-5PM'
    }
  }
];

const createTestSupervisors = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if supervisors already exist
    const existingCount = await User.countDocuments({ role: 'supervisor' });
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing supervisors. Skipping creation.`);
      process.exit(0);
    }

    // Hash passwords and create supervisors
    for (let supervisorData of testSupervisors) {
      const salt = await bcrypt.genSalt(10);
      supervisorData.password = await bcrypt.hash(supervisorData.password, salt);
      
      const supervisor = new User(supervisorData);
      await supervisor.save();
      console.log(`Created supervisor: ${supervisorData.name}`);
    }

    console.log('All test supervisors created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test supervisors:', error);
    process.exit(1);
  }
};

createTestSupervisors();
