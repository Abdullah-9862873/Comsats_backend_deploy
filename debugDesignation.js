const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const debugSupervisorDesignation = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Find the test supervisor we created
    const testSupervisor = await User.findOne({ email: 'test.supervisor@comsats.edu.pk' });
    console.log('\n=== Test Supervisor Data ===');
    console.log('Name:', testSupervisor?.name);
    console.log('Email:', testSupervisor?.email);
    console.log('Full supervisor object:', JSON.stringify(testSupervisor?.supervisor, null, 2));

    // Also check other supervisors
    const otherSupervisors = await User.find({ 
      role: 'supervisor',
      email: { $ne: 'test.supervisor@comsats.edu.pk' }
    }).limit(3);

    console.log('\n=== Other Supervisors ===');
    otherSupervisors.forEach((sup, index) => {
      console.log(`\n${index + 1}. ${sup.name} (${sup.email})`);
      console.log('Designation:', sup.supervisor?.designation);
      console.log('Department:', sup.supervisor?.department);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugSupervisorDesignation();
