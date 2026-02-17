const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testMisconductAPI = async () => {
  try {
    await connectDB();

    // Get a company user token
    const User = require('./models/User');
    const jwt = require('jsonwebtoken');
    
    const company = await User.findOne({ role: 'company' });
    if (!company) {
      console.log('❌ No company found');
      return;
    }

    const token = jwt.sign(
      { id: company._id, role: company.role },
      process.env.JWT_SECRET || 'fallback_secret'
    );

    console.log('🏢 Testing with company:', company.name);
    console.log('🔑 Generated token for company');

    // Test getting students
    const response = await fetch('http://localhost:5003/api/misconduct-reports/students', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Students API Response:', data);
      if (data.success && data.data.length > 0) {
        console.log('🎯 Students available for misconduct reports:');
        data.data.forEach((student, index) => {
          console.log(`   ${index + 1}. ${student.name} (${student.email})`);
        });
      } else {
        console.log('⚠️ No students found in response');
      }
    } else {
      console.log('❌ Students API failed:', response.status, response.statusText);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testMisconductAPI();
