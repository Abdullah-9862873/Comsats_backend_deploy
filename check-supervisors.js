const User = require('./models/User');
const mongoose = require('mongoose');
require('dotenv').config();

const checkSupervisors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find supervisor users
    const supervisors = await User.find({ role: 'supervisor' }).limit(3);
    console.log('Found supervisors:', supervisors.length);
    
    supervisors.forEach((sup, i) => {
      console.log(`Supervisor ${i + 1}:`);
      console.log(`  - Name: ${sup.name}`);
      console.log(`  - Email: ${sup.email}`);
      console.log(`  - Role: ${sup.role}`);
      console.log(`  - ID: ${sup._id}`);
    });
    
    // Also check all roles in database
    const allRoles = await User.distinct('role');
    console.log('\nAll roles in database:', allRoles);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
};

checkSupervisors();
