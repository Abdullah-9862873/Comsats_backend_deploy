const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const createTestSupervisor = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if supervisor already exists
    const existingSupervisor = await User.findOne({ email: 'test.supervisor@comsats.edu.pk' });
    if (existingSupervisor) {
      console.log('Test supervisor already exists:', existingSupervisor.email);
      process.exit(0);
    }

    // Create a new supervisor with known credentials
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    const supervisorData = {
      name: 'Dr. Test Supervisor',
      email: 'test.supervisor@comsats.edu.pk',
      password: hashedPassword,
      role: 'supervisor',
      supervisor: {
        department: 'Computer Science',
        designation: 'Assistant Professor',
        maxStudents: 8,
        currentStudents: 0,
        expertise: ['Machine Learning', 'Data Science', 'Python'],
        phone: '+92-51-9049-1234',
        office: 'Room 101, CS Department',
        officeHours: 'Mon-Wed-Fri, 10AM-12PM'
      }
    };

    const supervisor = new User(supervisorData);
    await supervisor.save();
    
    console.log('Test supervisor created successfully!');
    console.log('Email: test.supervisor@comsats.edu.pk');
    console.log('Password: test123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test supervisor:', error);
    process.exit(1);
  }
};

createTestSupervisor();
