const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const checkSupervisorData = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Find all supervisors and display their data
    const supervisors = await User.find({ role: 'supervisor' }).select('-password');
    
    console.log(`\nFound ${supervisors.length} supervisors:\n`);
    
    supervisors.forEach((supervisor, index) => {
      console.log(`${index + 1}. Supervisor:`, {
        id: supervisor._id,
        name: supervisor.name,
        email: supervisor.email,
        supervisor: supervisor.supervisor
      });
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking supervisor data:', error);
    process.exit(1);
  }
};

checkSupervisorData();
