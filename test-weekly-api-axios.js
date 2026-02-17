// Test the weekly reports API directly using Node.js fetch
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YmRjN2IxZjEwYTM2OTIxNGQ0MDE1OSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzU3Mjc5ODU3LCJleHAiOjE3NTc4ODQ2NTd9.C2HoCmaqHB2ovhrWDtKsKuSfb_35WYrswHHS0_GSS88';

const testAPI = async () => {
  try {
    console.log('🔄 Making request to: http://localhost:5003/api/weekly-reports/events/student');
    
    // Use axios instead of fetch for better Node.js compatibility
    const axios = require('axios');
    
    const response = await axios.get('http://localhost:5003/api/weekly-reports/events/student', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Status:', response.status);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('❌ HTTP Error:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
};

testAPI();
