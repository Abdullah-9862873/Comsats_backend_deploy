const axios = require('axios');

// Test the job update API endpoint
const testJobUpdateAPI = async () => {
  try {
    console.log('🧪 Testing Job Update API Endpoint\n');

    // You'll need to replace these with actual values from your frontend:
    const jobId = '68dd68732ab878c50772e0b7'; // Replace with actual job ID
    const authToken = 'your-jwt-token-here'; // Replace with actual token from localStorage

    const updateData = {
      applicationLimit: 75  // Just updating the application limit
    };

    console.log('📡 Making API request to update job...');
    console.log('Job ID:', jobId);
    console.log('Update data:', updateData);

    const response = await axios.put(
      `http://localhost:5005/api/jobs/${jobId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ API Request successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

  } catch (error) {
    console.error('❌ API Request failed:');
    console.error('Status:', error.response?.status);
    console.error('Error message:', error.response?.data?.message);
    console.error('Full error data:', error.response?.data);
  }
};

// Run the test
testJobUpdateAPI();