const jwt = require('jsonwebtoken');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const generateTestToken = async () => {
  try {
    await connectDB();
    
    // Find the existing student user
    const existingUser = await User.findOne({ email: 'student123@gmail.com' });
    
    if (existingUser) {
      console.log('Found user:', existingUser.name, '- ID:', existingUser._id);
      
      // Generate new token
      const token = jwt.sign(
        { id: existingUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      console.log('\nGenerated new token:');
      console.log(token);
      
      // Verify it works
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('\nToken verified successfully! User ID:', decoded.id);
      console.log('Expires at:', new Date(decoded.exp * 1000));
      
    } else {
      console.log('User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

generateTestToken();
