// Simple test for company evaluations endpoint
const axios = require('axios');

async function testAPI() {
  try {
    // Use a valid supervisor token (from the logs, we can see one is working)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmE4MzNjMWQxODNiNzJmMDA4NTVkOSIsInJvbGUiOiJzdXBlcnZpc29yIiwiaWF0IjoxNzU3NTk5MzIxLCJleHAiOjE3NTgyMDQxMjF9.gh5rpudf0OILPEI1xSUVrGJKZo9gAWBscEykusAW9Fs';
    
    console.log('🔍 Testing API endpoint...');
    
    const response = await axios.get('http://localhost:5005/api/internee-evaluations/supervisor/evaluations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📊 Data received:', response.data);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📝 Sample evaluation:');
      console.log(JSON.stringify(response.data.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
