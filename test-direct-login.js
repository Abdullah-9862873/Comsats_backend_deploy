const axios = require('axios');

const testDirectLogin = async () => {
  try {
    console.log('🔍 Testing direct login to backend API...\n');
    
    const loginData = {
      email: 'admin@comsats.edu.pk',
      password: 'Admin@123'
    };

    // Test different possible backend URLs
    const possibleUrls = [
      'http://localhost:5005/api/auth/login',
      'http://localhost:5000/api/auth/login',
      'http://localhost:3000/api/auth/login'
    ];

    for (const url of possibleUrls) {
      try {
        console.log(`Testing: ${url}`);
        const response = await axios.post(url, loginData, {
          timeout: 3000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return;
        
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('❌ Connection refused (server not running)');
        } else if (error.response) {
          console.log('❌ Response error:');
          console.log('Status:', error.response.status);
          console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
          console.log('❌ Error:', error.message);
        }
        console.log('');
      }
    }

    console.log('🚫 No backend server found running. Please start the backend server first.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testDirectLogin();