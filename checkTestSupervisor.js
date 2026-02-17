const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const checkSpecificSupervisor = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Find the test supervisor we created
    const supervisor = await User.findOne({ 
      email: 'test.supervisor@comsats.edu.pk' 
    }).select('-password');
    
    if (supervisor) {
      console.log('\nTest Supervisor Found:');
      console.log('Name:', supervisor.name);
      console.log('Email:', supervisor.email);
      console.log('Role:', supervisor.role);
      console.log('\nSupervisor Object:');
      console.log(JSON.stringify(supervisor.supervisor, null, 2));
      
      console.log('\nSpecific Fields:');
      console.log('Department:', supervisor.supervisor?.department);
      console.log('Designation:', supervisor.supervisor?.designation);
      console.log('Phone:', supervisor.supervisor?.phone);
      console.log('Office:', supervisor.supervisor?.office);
    } else {
      console.log('Test supervisor not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkSpecificSupervisor();
