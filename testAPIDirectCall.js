const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const testAPIEndpoint = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find Tech Pro company
    const company = await User.findOne({ name: 'Tech Pro' });
    if (!company) {
      console.log('❌ Tech Pro company not found');
      return;
    }
    
    console.log('✅ Found company:', company.name, 'ID:', company._id);

    // Generate JWT token for this company
    const token = jwt.sign(
      { 
        id: company._id, 
        role: company.role,
        email: company.email
      },
      'abcqwe123rtyh6',
      { expiresIn: '24h' }
    );

    console.log('✅ Generated token for:', company.name);

    // Make API request
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5003/api/misconduct-reports/students', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
      
      if (data.data && data.data.length > 0) {
        console.log('\n👥 Students available for misconduct reports:');
        data.data.forEach((student, index) => {
          console.log(`   ${index + 1}. ${student.name} (${student.email})`);
        });
      } else {
        console.log('❌ No students returned from API');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testAPIEndpoint();
