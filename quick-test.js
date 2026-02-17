const axios = require('axios');

async function quickTest() {
  console.log('🧪 Quick Fake Email Detection Test...\n');
  
  try {
    // Test 1: Fake email should be blocked
    console.log('1️⃣ Testing fake email (should be blocked)...');
    const fakeEmailResponse = await axios.post('http://localhost:5005/api/auth/register', {
      name: 'Fake User',
      email: 'fake@10minutemail.com',
      password: 'test123',
      role: 'student',
      department: 'CS',
      semester: '6',
      regNo: 'SP22-999'
    });
    console.log('❌ UNEXPECTED: Fake email was not blocked!');
    
  } catch (error) {
    if (error.response?.data?.error === 'FAKE_EMAIL_DETECTED') {
      console.log('✅ SUCCESS: Fake email correctly blocked');
      console.log(`   Reason: ${error.response.data.reason}`);
      console.log(`   Confidence: ${error.response.data.confidence}%`);
    } else {
      console.log('❌ ERROR:', error.response?.data?.message || error.message);
    }
  }
  
  console.log('');
  
  try {
    // Test 2: Legitimate email should be allowed
    console.log('2️⃣ Testing legitimate email (should be allowed)...');
    const legitimateEmailResponse = await axios.post('http://localhost:5005/api/auth/register', {
      name: 'John Doe',
      email: `test.user.${Date.now()}@gmail.com`,
      password: 'test123',
      role: 'student',
      department: 'CS',
      semester: '6',
      regNo: 'SP22-998'
    });
    console.log('✅ SUCCESS: Legitimate email was allowed');
    console.log(`   Message: ${legitimateEmailResponse.data.message}`);
    
  } catch (error) {
    console.log('❌ UNEXPECTED: Legitimate email was blocked');
    console.log('   Error:', error.response?.data?.message || error.message);
  }
}

quickTest();