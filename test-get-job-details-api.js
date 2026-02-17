const express = require('express');
const { getJobDetails } = require('./controllers/adminController');

// Mock request and response objects for testing
const mockReq = {
  params: { jobId: '68dd6cc56b28df89200ce2d3' }
};

const mockRes = {
  status: (code) => {
    console.log('Status:', code);
    return mockRes;
  },
  json: (data) => {
    console.log('Response data:');
    console.log(JSON.stringify(data, null, 2));
    return mockRes;
  }
};

// Test the getJobDetails function
async function testGetJobDetails() {
  console.log('🧪 Testing getJobDetails function...');
  
  // Setup database connection
  const mongoose = require('mongoose');
  const User = require('./models/User');
  const Job = require('./models/Job');
  const Application = require('./models/Application');
  
  try {
    await mongoose.connect('mongodb://localhost:27017/internship_portal');
    console.log('✅ Connected to MongoDB');
    
    await getJobDetails(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testGetJobDetails();