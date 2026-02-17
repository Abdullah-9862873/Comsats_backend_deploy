const axios = require('axios');

// Test the backend server is responding
async function testServerHealth() {
  try {
    console.log('🔍 Testing backend server health...');
    
    // Test basic server response
    const response = await axios.get('http://localhost:5003/api');
    console.log('✅ Server is responding:', response.status);
    
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testServerHealth();
