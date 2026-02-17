const axios = require('axios');

async function testEmailVerification() {
  try {
    console.log('🧪 Testing Email Verification...\n');
    
    const testData = {
      name: 'Test Student',
      email: `test.${Date.now()}@comsats.edu.pk`,
      password: 'test123',
      role: 'student',
      department: 'Computer Science',
      semester: '6',
      regNo: 'SP22-999'
    };
    
    console.log('📝 Registering student...');
    const response = await axios.post('http://localhost:5005/api/auth/register', testData);
    console.log('✅ Registration success:', response.data);
    
    // Test login without verification
    console.log('\n🔐 Trying to login without verification...');
    try {
      const loginResponse = await axios.post('http://localhost:5005/api/auth/login', {
        email: testData.email,
        password: testData.password
      });
      console.log('❌ Login should have failed but succeeded:', loginResponse.data);
    } catch (loginError) {
      if (loginError.response?.status === 403) {
        console.log('✅ Login correctly blocked:', loginError.response.data);
      } else {
        console.log('❌ Unexpected error:', loginError.response?.data || loginError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEmailVerification();