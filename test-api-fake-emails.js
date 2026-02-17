const axios = require('axios');

const API_BASE_URL = 'http://localhost:5005/api';

async function testAPIWithFakeEmails() {
  console.log('🌐 Testing API Registration with Fake Email Detection...\n');

  const testCases = [
    {
      name: 'Legitimate Student',
      email: 'john.student@gmail.com',
      shouldSucceed: true
    },
    {
      name: 'Fake Email Student', 
      email: 'fake@10minutemail.com',
      shouldSucceed: false
    },
    {
      name: 'Supervisor with Temp Email',
      email: 'supervisor@tempmail.org', 
      shouldSucceed: false
    },
    {
      name: 'Company with Mailinator',
      email: 'company@mailinator.com',
      shouldSucceed: false
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`🧪 Testing: ${testCase.name} (${testCase.email})`);
      
      const registrationData = {
        name: 'Test User',
        email: testCase.email,
        password: 'testPassword123',
        role: 'student',
        department: 'Computer Science',
        semester: '6',
        regNo: 'SP22-BCS-999'
      };

      const response = await axios.post(`${API_BASE_URL}/auth/register`, registrationData);
      
      if (testCase.shouldSucceed) {
        console.log(`✅ SUCCESS: Registration allowed for legitimate email`);
        console.log(`   Message: ${response.data.message}`);
      } else {
        console.log(`❌ FAIL: Fake email was not blocked!`);
        console.log(`   Message: ${response.data.message}`);
      }

    } catch (error) {
      if (testCase.shouldSucceed) {
        console.log(`❌ FAIL: Legitimate email was blocked`);
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
      } else {
        const errorData = error.response?.data;
        if (errorData?.error === 'FAKE_EMAIL_DETECTED') {
          console.log(`✅ SUCCESS: Fake email correctly blocked`);
          console.log(`   Reason: ${errorData.reason}`);
          console.log(`   Confidence: ${errorData.confidence}%`);
        } else {
          console.log(`✅ SUCCESS: Registration blocked (reason: ${errorData?.message || 'Unknown'})`);
        }
      }
    }
    
    console.log(''); // Empty line
    await new Promise(resolve => setTimeout(resolve, 500)); // Short delay
  }

  console.log('🎉 API Testing Complete!');
}

testAPIWithFakeEmails().catch(console.error);