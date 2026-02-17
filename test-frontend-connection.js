const axios = require('axios');

const testFrontendBackendConnection = async () => {
  try {
    console.log('🔍 Testing Frontend-Backend Connection...\n');
    
    // Test the exact API call that frontend would make
    const response = await axios.post('http://localhost:5005/api/auth/login', {
      email: 'admin@comsats.edu.pk',
      password: 'Admin@123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 5000
    });

    console.log('✅ LOGIN SUCCESS!');
    console.log('Status:', response.status);
    console.log('User:', response.data.user);
    console.log('Token received:', !!response.data.token);
    console.log('\n🎉 The admin credentials are working correctly!');
    console.log('📧 Email: admin@comsats.edu.pk');
    console.log('🔑 Password: Admin@123');
    console.log('\n💡 If the frontend login is still not working:');
    console.log('1. Clear browser cache and cookies');
    console.log('2. Open developer tools (F12) and check for any JavaScript errors');
    console.log('3. Check the Network tab to see if the login request is being made');
    console.log('4. Ensure the frontend server is running on the correct port');

  } catch (error) {
    console.error('❌ Connection test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
};

testFrontendBackendConnection();